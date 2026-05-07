import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable audit logs." }, { status: 503 })

const sanitizeOptionalString = (value: unknown, maxLength: number) => {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

const sanitizeMetadata = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireAdminRequest(request)
    const logs = await prisma.auditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true },
    })
    return NextResponse.json({ logs })
  } catch (error) {
    const accessResponse = handleAccessRouteError(error)
    if (accessResponse) return accessResponse
    console.error("Audit logs fetch failed", error)
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireAdminRequest(request)
    const limit = rateLimit(getRateLimitKey(request, "audit-write", { orgId: org.id, userId: user.id }), {
      limit: 30,
      windowMs: 60_000,
    })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const body = await request.json()
    const action = sanitizeOptionalString(body?.action, 120)
    const entity = sanitizeOptionalString(body?.entity, 80)
    const entityId = sanitizeOptionalString(body?.entityId, 120)
    const metadata = sanitizeMetadata(body?.metadata)
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 })
    }

    const log = await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action,
      entity,
      entityId,
      metadata: {
        ...(metadata || {}),
        source: "manual-admin",
        loggedAt: new Date().toISOString(),
      },
    })
    if (!log) {
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
    }

    const hydrated = await prisma.auditLog.findUnique({
      where: { id: log.id },
      include: { user: true },
    })

    return NextResponse.json({ log: hydrated ?? log })
  } catch (error) {
    const accessResponse = handleAccessRouteError(error)
    if (accessResponse) return accessResponse
    console.error("Audit log create failed", error)
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
  }
}
