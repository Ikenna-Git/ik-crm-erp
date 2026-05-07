import { NextResponse } from "next/server"
import { applyBillingLifecycleEvent, captureBillingProviderFailure, isBillingProviderError, verifyBillingWebhook } from "@/lib/billing-provider"
import { logServerEvent } from "@/lib/observability"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable billing webhooks." }, { status: 503 })

const detectProviderHint = (request: Request) => {
  if (request.headers.get("stripe-signature")) return "stripe"
  if (request.headers.get("x-paystack-signature")) return "paystack"
  if (request.headers.get("verif-hash")) return "flutterwave"
  return "unknown"
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  const providerHint = detectProviderHint(request)
  const limit = await rateLimit(getRateLimitKey(request, "billing-webhook", { extra: providerHint }), {
    limit: 120,
    windowMs: 60_000,
    strictInProduction: true,
    action: "billing.webhook",
  })
  if (!limit.ok) {
    return createRateLimitErrorResponse(limit, {
      exceeded: "Webhook rate limit exceeded.",
      unavailable: "Webhook protection is not configured correctly right now.",
    })
  }

  try {
    const verified = await verifyBillingWebhook(request)
    const appliedResults = []

    for (const event of verified.events) {
      appliedResults.push(await applyBillingLifecycleEvent({ request, event }))
    }

    void logServerEvent({
      level: "info",
      category: "billing",
      action: "billing.webhook.received",
      message: "Billing webhook processed.",
      request,
      metadata: {
        provider: verified.provider,
        rawType: verified.rawType,
        eventsReceived: verified.events.length,
        eventsApplied: appliedResults.filter((entry) => entry.applied).length,
      },
    })

    return NextResponse.json({
      received: true,
      provider: verified.provider,
      eventsReceived: verified.events.length,
      eventsApplied: appliedResults.filter((entry) => entry.applied).length,
      eventsIgnored: appliedResults.filter((entry) => !entry.applied).length,
    })
  } catch (error) {
    if (isBillingProviderError(error)) {
      if (error.status >= 500) {
        void captureBillingProviderFailure({
          request,
          action: "billing.webhook.failed",
          error,
          metadata: { providerHint, status: error.status, code: error.code },
        })
      } else {
        void logServerEvent({
          level: error.status >= 500 ? "error" : "warning",
          category: "billing",
          action: "billing.webhook.rejected",
          message: error.message,
          request,
          metadata: { providerHint, status: error.status, code: error.code },
        })
      }

      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    void captureBillingProviderFailure({
      request,
      action: "billing.webhook.failed",
      error,
      metadata: { providerHint },
    })
    return NextResponse.json({ error: "Failed to process billing webhook" }, { status: 500 })
  }
}
