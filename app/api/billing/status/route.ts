import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuthenticatedRequest, handleAccessRouteError } from "@/lib/access-route"
import { assertBillingFeatureAccess } from "@/lib/billing"
import { getBillingStatusPayload } from "@/lib/billing-provider"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable billing status." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAuthenticatedRequest(request)
    const limit = await rateLimit(getRateLimitKey(request, "billing-status", { orgId: org.id, userId: user.id }), {
      limit: 60,
      windowMs: 60_000,
      strictInProduction: false,
      action: "billing.status",
    })
    if (!limit.ok) {
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many billing status requests. Please wait a minute and try again.",
        unavailable: "Billing status protection is not configured correctly right now. Try again later.",
      })
    }

    await assertBillingFeatureAccess({ request, org, user, feature: "billing.status.view" })

    const seatsUsed = await prisma.user.count({ where: { orgId: org.id } })
    return NextResponse.json({
      ...getBillingStatusPayload({ org, seatsUsed }),
      permissions: {
        canStartCheckout: user.role === "ORG_OWNER" || user.role === "SUPER_ADMIN",
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load billing status")
  }
}
