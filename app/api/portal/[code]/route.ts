import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

export async function GET(_request: Request, context: { params: { code: string } }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 })
  }
  try {
    const { code } = context.params
    if (!code) return NextResponse.json({ error: "Portal code is required" }, { status: 400 })

    const limit = rateLimit(getRateLimitKey(_request, `portal-view:${code}`), { limit: 100, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many portal requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const portal = await prisma.clientPortal.findUnique({
      where: { accessCode: code },
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 12 },
        documents: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    })
    if (!portal) return NextResponse.json({ error: "Portal not found" }, { status: 404 })
    return NextResponse.json({
      portal: {
        id: portal.id,
        name: portal.name,
        contactName: portal.contactName,
        summary: portal.summary,
        status: portal.status,
        updatedAt: portal.updatedAt,
        updates: portal.updates,
        documents: portal.documents,
      },
    })
  } catch (error) {
    console.error("Portal fetch failed", error)
    return NextResponse.json({ error: "Failed to load portal" }, { status: 500 })
  }
}
