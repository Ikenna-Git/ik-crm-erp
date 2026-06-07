import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { canManageWorkspaceSettings, canViewFounderControls } from "@/lib/authz"
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  BILLING_PLAN_LABELS,
  BILLING_PLANS,
  BILLING_STATUS_LABELS,
  BILLING_STATUSES,
  getBillingProviderReadiness,
  normalizeBillingCycle,
  normalizeBillingPlan,
  normalizeBillingStatus,
} from "@/lib/billing"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"

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
    const showFounderControls = canViewFounderControls(user.role, user.email)

    const [seatUsage, privilegedUserCount] = await Promise.all([
      prisma.user.count({
        where: {
          orgId: org.id,
          ...(showFounderControls ? {} : { role: { not: "SUPER_ADMIN" } }),
        },
      }),
      prisma.user.count({
        where: {
          orgId: org.id,
          role: { in: showFounderControls ? ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] : ["ORG_OWNER", "ADMIN"] },
        },
      }),
    ])

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
        paymentCustomerRef: showFounderControls ? org.paymentCustomerRef || "" : "",
        paymentSubscriptionRef: showFounderControls ? org.paymentSubscriptionRef || "" : "",
      },
      summary: {
        seatsUsed: seatUsage,
        seatsRemaining: Math.max((org.seatLimit || 5) - seatUsage, 0),
        privilegedUserCount,
      },
      permissions: {
        canManageBilling: canManageWorkspaceSettings(user.role, user.email),
        canEditProviderRefs: showFounderControls,
        isPlatformSuperAdmin: showFounderControls,
      },
      options: {
        plans: BILLING_PLANS.map((value) => ({ value, label: BILLING_PLAN_LABELS[value] })),
        statuses: BILLING_STATUSES.map((value) => ({ value, label: BILLING_STATUS_LABELS[value] })),
        cycles: BILLING_CYCLES.map((value) => ({ value, label: BILLING_CYCLE_LABELS[value] })),
      },
      providerReadiness: getBillingProviderReadiness(),
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load billing settings")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request, { requireWorkspaceOwner: true })
    const showFounderControls = canViewFounderControls(user.role, user.email)

    const body = await request.json()
    const billingEmail = String(body?.billingEmail || "").trim()
    const updateData: Record<string, unknown> = {
      billingEmail: billingEmail || null,
    }

    if (showFounderControls) {
      updateData.billingPlan = normalizeBillingPlan(body?.billingPlan || org.billingPlan)
      updateData.billingStatus = normalizeBillingStatus(body?.billingStatus || org.billingStatus)
      updateData.billingCycle = normalizeBillingCycle(body?.billingCycle || org.billingCycle)
      updateData.seatLimit = Math.max(Number(body?.seatLimit || org.seatLimit || 5) || 5, 1)
      updateData.nextBillingDate = parseOptionalDate(body?.nextBillingDate)
      updateData.trialEndsAt = parseOptionalDate(body?.trialEndsAt)
      updateData.paymentProvider = String(body?.paymentProvider || "").trim() || null
      updateData.paymentCustomerRef = String(body?.paymentCustomerRef || "").trim() || null
      updateData.paymentSubscriptionRef = String(body?.paymentSubscriptionRef || "").trim() || null
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
        paymentCustomerRef: showFounderControls ? updated.paymentCustomerRef || "" : "",
        paymentSubscriptionRef: showFounderControls ? updated.paymentSubscriptionRef || "" : "",
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update billing settings")
  }
}
