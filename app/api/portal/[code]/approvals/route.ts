import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable approvals." }, { status: 503 })

const normalizeDecision = (value?: string) => {
  const upper = (value || "").toUpperCase()
  if (upper === "APPROVED" || upper === "REJECTED") return upper
  return null
}

export async function POST(request: Request, { params }: { params: { code: string } }) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const code = params.code?.trim()
    if (!code) {
      return NextResponse.json({ error: "Portal code is required" }, { status: 400 })
    }

    const limit = rateLimit(getRateLimitKey(request, `portal-approval:${code}`), { limit: 60, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many approval requests. Please retry shortly." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const body = await request.json()
    const { updateId, decision, actorName } = body || {}
    const normalized = normalizeDecision(decision)
    if (!updateId || !normalized) {
      return NextResponse.json({ error: "updateId and decision are required" }, { status: 400 })
    }

    const portal = await prisma.clientPortal.findUnique({
      where: { accessCode: code },
    })
    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 })
    }

    const update = await prisma.clientPortalUpdate.findUnique({ where: { id: updateId } })
    if (!update || update.portalId !== portal.id) {
      return NextResponse.json({ error: "Update not found" }, { status: 404 })
    }

    const updated = await prisma.clientPortalUpdate.update({
      where: { id: updateId },
      data: { status: normalized },
    })

    await createAuditLog({
      orgId: portal.orgId,
      action: `Client portal update ${normalized.toLowerCase()}`,
      entity: "ClientPortalUpdate",
      entityId: updateId,
      metadata: { actorName: actorName || "Client", decision: normalized },
    })

    return NextResponse.json({ update: updated })
  } catch (error) {
    console.error("Portal approval failed", error)
    return NextResponse.json({ error: "Failed to update approval" }, { status: 500 })
  }
}
