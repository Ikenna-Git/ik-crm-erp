import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { canManageWorkspaceSettings, isSuperAdmin } from "@/lib/authz"
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  BILLING_PLAN_LABELS,
  BILLING_PLANS,
  BILLING_STATUS_LABELS,
  BILLING_STATUSES,
  getBillingFeatureAvailability,
  getBillingProviderReadiness,
  getSeatAvailability,
  hasBillingFeature,
  normalizeBillingCycle,
  normalizeBillingPlan,
  normalizeBillingStatus,
} from "@/lib/billing"
import { BILLING_PROVIDER_NAMES, getBillingProviderRuntimeSummary, getBillingStatusPayload, normalizeBillingProviderName } from "@/lib/billing-provider"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"
import { logServerEvent } from "@/lib/observability"
import { assertActionAccess } from "@/lib/rbac"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable billing controls." }, { status: 503 })

const parseOptionalDate = (value: unknown) => {
  if (!value) return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request)
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "billing.view" })

    const [seatUsage, privilegedUserCount] = await Promise.all([
      prisma.user.count({ where: { orgId: org.id } }),
      prisma.user.count({ where: { orgId: org.id, role: { in: ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] } } }),
    ])
    const seatAvailability = getSeatAvailability(org, seatUsage)
    const billingStatus = getBillingStatusPayload({ org, seatsUsed: seatUsage })
    const providerRuntime = getBillingProviderRuntimeSummary(org)

    return NextResponse.json({
      org: {
        id: org.id,
        name: org.name,
        billingPlan: org.billingPlan || "trial",
        billingStatus: org.billingStatus || "trial",
        billingCycle: org.billingCycle || "monthly",
        billingEmail: org.billingEmail || org.notifyEmail || "",
        seatLimit: org.seatLimit || 5,
        nextBillingDate: org.nextBillingDate,
        trialEndsAt: org.trialEndsAt,
        paymentProvider: org.paymentProvider || "",
        paymentCustomerRef: isSuperAdmin(user.role) ? org.paymentCustomerRef || "" : "",
        paymentSubscriptionRef: isSuperAdmin(user.role) ? org.paymentSubscriptionRef || "" : "",
      },
      summary: {
        seatsUsed: seatUsage,
        seatsRemaining: seatAvailability.remaining,
        privilegedUserCount,
        atSeatLimit: seatUsage >= seatAvailability.limit,
      },
      permissions: {
        canManageBilling: canManageWorkspaceSettings(user.role),
        canEditProviderRefs: isSuperAdmin(user.role),
        isPlatformSuperAdmin: isSuperAdmin(user.role),
      },
      options: {
        plans: BILLING_PLANS.map((value) => ({ value, label: BILLING_PLAN_LABELS[value] })),
        statuses: BILLING_STATUSES.map((value) => ({ value, label: BILLING_STATUS_LABELS[value] })),
        cycles: BILLING_CYCLES.map((value) => ({ value, label: BILLING_CYCLE_LABELS[value] })),
      },
      providerReadiness: getBillingProviderReadiness(),
      providerRuntime,
      billingReadiness: {
        ...billingStatus.billingReadiness,
        checkoutAvailable: providerRuntime.checkoutAvailable,
        webhookAvailable: providerRuntime.webhookAvailable,
      },
      featureAccess: getBillingFeatureAvailability(org),
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load billing settings")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request, { requireWorkspaceOwner: true })
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "billing.manage" })
    const limit = await rateLimit(getRateLimitKey(request, "admin-billing-update", { orgId: org.id, userId: user.id }), {
      limit: 12,
      windowMs: 60_000,
      strictInProduction: true,
      action: "admin.billing.update",
    })
    if (!limit.ok) {
      if (limit.reason === "exceeded") {
        void logServerEvent({
          level: "warning",
          category: "billing",
          action: "admin.billing.rate_limited",
          message: "Billing settings update was rate limited.",
          request,
          actor: { id: user.id, email: user.email, role: user.role },
          orgId: org.id,
        })
      }
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many billing changes. Please wait a minute and try again.",
        unavailable: "Billing protection is not configured correctly right now. Try again later.",
      })
    }

    const body = await request.json()
    const billingEmail = String(body?.billingEmail || "").trim()
    const updateData: Record<string, unknown> = {
      billingEmail: billingEmail || null,
    }

    if (isSuperAdmin(user.role)) {
      await assertActionAccess({ request, subject: user, orgId: org.id, action: "billing.providerRefs.manage" })
      const provider = normalizeBillingProviderName(body?.paymentProvider)
      if (body?.paymentProvider && !provider) {
        return NextResponse.json(
          { error: `paymentProvider must be one of: ${BILLING_PROVIDER_NAMES.join(", ")}` },
          { status: 400 },
        )
      }
      updateData.billingPlan = normalizeBillingPlan(body?.billingPlan || org.billingPlan)
      updateData.billingStatus = normalizeBillingStatus(body?.billingStatus || org.billingStatus)
      updateData.billingCycle = normalizeBillingCycle(body?.billingCycle || org.billingCycle)
      updateData.seatLimit = Math.max(Number(body?.seatLimit || org.seatLimit || 5) || 5, 1)
      updateData.nextBillingDate = parseOptionalDate(body?.nextBillingDate)
      updateData.trialEndsAt = parseOptionalDate(body?.trialEndsAt)
      updateData.paymentProvider = provider || null
      updateData.paymentCustomerRef = String(body?.paymentCustomerRef || "").trim() || null
      updateData.paymentSubscriptionRef = String(body?.paymentSubscriptionRef || "").trim() || null
    }

    if (!isSuperAdmin(user.role) && !hasBillingFeature(org, "billing.settings.manage")) {
      return NextResponse.json({ error: "Billing settings are not available for this plan yet." }, { status: 403 })
    }

    const updated = await prisma.org.update({
      where: { id: org.id },
      data: updateData,
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "admin.billing.updated",
      entity: "Org",
      entityId: org.id,
      metadata: {
        billingPlan: updated.billingPlan,
        billingStatus: updated.billingStatus,
        billingCycle: updated.billingCycle,
        seatLimit: updated.seatLimit,
        billingEmail: updated.billingEmail,
        paymentProvider: updated.paymentProvider,
      },
    })

    void logServerEvent({
      level: "info",
      category: "billing",
      action: "admin.billing.updated",
      message: "Billing settings were updated.",
      request,
      actor: { id: user.id, email: user.email, role: user.role },
      orgId: org.id,
      metadata: {
        billingPlan: updated.billingPlan,
        billingStatus: updated.billingStatus,
        billingCycle: updated.billingCycle,
        paymentProvider: updated.paymentProvider,
      },
    })

    const seatsUsed = await prisma.user.count({ where: { orgId: updated.id } })
    const seatAvailability = getSeatAvailability(updated, seatsUsed)
    const billingStatus = getBillingStatusPayload({ org: updated, seatsUsed })
    const providerRuntime = getBillingProviderRuntimeSummary(updated)

    return NextResponse.json({
      org: {
        id: updated.id,
        name: updated.name,
        billingPlan: updated.billingPlan,
        billingStatus: updated.billingStatus,
        billingCycle: updated.billingCycle,
        billingEmail: updated.billingEmail || "",
        seatLimit: updated.seatLimit,
        nextBillingDate: updated.nextBillingDate,
        trialEndsAt: updated.trialEndsAt,
        paymentProvider: updated.paymentProvider || "",
        paymentCustomerRef: isSuperAdmin(user.role) ? updated.paymentCustomerRef || "" : "",
        paymentSubscriptionRef: isSuperAdmin(user.role) ? updated.paymentSubscriptionRef || "" : "",
      },
      summary: {
        seatsUsed,
        seatsRemaining: seatAvailability.remaining,
        privilegedUserCount: await prisma.user.count({
          where: { orgId: updated.id, role: { in: ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] } },
        }),
        atSeatLimit: seatsUsed >= seatAvailability.limit,
      },
      providerRuntime,
      billingReadiness: {
        ...billingStatus.billingReadiness,
        checkoutAvailable: providerRuntime.checkoutAvailable,
        webhookAvailable: providerRuntime.webhookAvailable,
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update billing settings")
  }
}
