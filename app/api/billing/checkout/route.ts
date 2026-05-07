import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { assertBillingFeatureAccess } from "@/lib/billing"
import { captureBillingProviderFailure, createBillingCheckout, getBillingProviderRuntimeSummary, isBillingProviderError } from "@/lib/billing-provider"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"
import { logServerEvent } from "@/lib/observability"
import { assertActionAccess } from "@/lib/rbac"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable billing checkout." }, { status: 503 })

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request, { requireWorkspaceOwner: true })
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "billing.manage" })
    await assertBillingFeatureAccess({ request, org, user, feature: "billing.checkout" })

    const limit = await rateLimit(getRateLimitKey(request, "billing-checkout", { orgId: org.id, userId: user.id }), {
      limit: 8,
      windowMs: 60_000,
      strictInProduction: true,
      action: "billing.checkout",
    })
    if (!limit.ok) {
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many checkout requests. Please wait a minute and try again.",
        unavailable: "Billing checkout protection is not configured correctly right now. Try again later.",
      })
    }

    const body = await request.json().catch(() => ({}))
    const checkout = await createBillingCheckout({
      request,
      org,
      actor: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      plan: body?.plan,
      cycle: body?.cycle,
      successUrl: body?.successUrl,
      cancelUrl: body?.cancelUrl,
    })

    await prisma.org.update({
      where: { id: org.id },
      data: {
        paymentProvider: checkout.provider,
        paymentCustomerRef: checkout.customerRef || org.paymentCustomerRef || null,
        billingEmail: org.billingEmail || user.email,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "billing.checkout.requested",
      entity: "Org",
      entityId: org.id,
      metadata: {
        provider: checkout.provider,
        billingPlan: checkout.plan,
        billingCycle: checkout.cycle,
        sessionId: checkout.sessionId,
      },
    })

    void logServerEvent({
      level: "info",
      category: "billing",
      action: "billing.checkout.requested",
      message: "Billing checkout session created.",
      request,
      actor: { id: user.id, email: user.email, role: user.role },
      orgId: org.id,
      metadata: {
        provider: checkout.provider,
        billingPlan: checkout.plan,
        billingCycle: checkout.cycle,
        sessionId: checkout.sessionId,
      },
    })

    return NextResponse.json({
      checkout: {
        provider: checkout.provider,
        sessionId: checkout.sessionId,
        redirectUrl: checkout.redirectUrl,
        billingPlan: checkout.plan,
        billingCycle: checkout.cycle,
      },
      providerRuntime: getBillingProviderRuntimeSummary(org),
    })
  } catch (error) {
    if (isBillingProviderError(error)) {
      if (error.status >= 500) {
        void captureBillingProviderFailure({
          request,
          action: "billing.checkout.failed",
          error,
          metadata: { status: error.status, code: error.code },
        })
      } else {
        void logServerEvent({
          level: "warning",
          category: "billing",
          action: "billing.checkout.rejected",
          message: error.message,
          request,
          metadata: { code: error.code, status: error.status },
        })
      }

      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }

    return handleAccessRouteError(error, "Failed to create billing checkout")
  }
}
