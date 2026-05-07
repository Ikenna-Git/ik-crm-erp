import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logServerEvent } from "@/lib/observability"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

export async function GET(_request: NextRequest, context: { params: Promise<{ code: string }> }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 })
  }
  try {
    const { code } = await context.params
    if (!code) return NextResponse.json({ error: "Portal code is required" }, { status: 400 })

    const limit = await rateLimit(getRateLimitKey(_request, "portal-view", { code }), {
      limit: 100,
      windowMs: 60_000,
      strictInProduction: true,
      action: "portal.view",
    })
    if (!limit.ok) {
      if (limit.reason === "exceeded") {
        void logServerEvent({
          level: "warning",
          category: "portal",
          action: "portal.view.rate_limited",
          message: "Public portal view request was rate limited.",
          request: _request,
          metadata: { code },
        })
      }
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many portal requests. Please try again shortly.",
        unavailable: "Portal protection is not configured correctly right now. Try again later.",
      })
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
