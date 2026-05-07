import { createAuditLog } from "@/lib/audit"
import { RequestUserError } from "@/lib/request-user"
import { logServerEvent } from "@/lib/observability"

export const BILLING_PLANS = ["trial", "starter", "professional", "enterprise"] as const
export const BILLING_STATUSES = ["trial", "active", "past_due", "suspended", "canceled"] as const
export const BILLING_CYCLES = ["monthly", "quarterly", "annual", "custom"] as const
export const BILLING_FEATURES = [
  "billing.settings.manage",
  "billing.provider_refs.manage",
  "billing.checkout",
  "billing.status.view",
  "crm.core",
  "accounting.core",
  "reports.core",
  "reports.export",
  "reports.export.email",
  "uploads.manage",
  "ai.use",
  "webhooks.manage",
  "portal.core",
  "portal.manage",
  "projects.core",
  "hr.core",
  "inventory.core",
  "team.members.manage",
  "seats.visibility",
  "analytics.advanced",
  "playbooks.manage",
  "workflows.manage",
  "plan.gating",
] as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type BillingStatus = (typeof BILLING_STATUSES)[number]
export type BillingCycle = (typeof BILLING_CYCLES)[number]
export type BillingFeature = (typeof BILLING_FEATURES)[number]

export const BILLING_PLAN_LABELS: Record<BillingPlan, string> = {
  trial: "Trial",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
}

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  trial: "Trial",
  active: "Active",
  past_due: "Past due",
  suspended: "Suspended",
  canceled: "Canceled",
}

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  custom: "Custom",
}

const ALWAYS_AVAILABLE_BILLING_FEATURES = new Set<BillingFeature>([
  "billing.settings.manage",
  "billing.checkout",
  "billing.status.view",
  "seats.visibility",
])

const BILLING_FEATURE_MATRIX: Record<BillingPlan, Record<BillingFeature, boolean>> = {
  trial: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "billing.checkout": true,
    "billing.status.view": true,
    "crm.core": true,
    "accounting.core": true,
    "reports.core": true,
    "reports.export": true,
    "reports.export.email": false,
    "uploads.manage": true,
    "ai.use": true,
    "webhooks.manage": false,
    "portal.core": true,
    "portal.manage": true,
    "projects.core": true,
    "hr.core": true,
    "inventory.core": true,
    "team.members.manage": true,
    "seats.visibility": true,
    "analytics.advanced": false,
    "playbooks.manage": false,
    "workflows.manage": false,
    "plan.gating": true,
  },
  starter: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "billing.checkout": true,
    "billing.status.view": true,
    "crm.core": true,
    "accounting.core": true,
    "reports.core": true,
    "reports.export": true,
    "reports.export.email": true,
    "uploads.manage": true,
    "ai.use": true,
    "webhooks.manage": false,
    "portal.core": true,
    "portal.manage": true,
    "projects.core": true,
    "hr.core": true,
    "inventory.core": true,
    "team.members.manage": true,
    "seats.visibility": true,
    "analytics.advanced": false,
    "playbooks.manage": false,
    "workflows.manage": false,
    "plan.gating": true,
  },
  professional: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "billing.checkout": true,
    "billing.status.view": true,
    "crm.core": true,
    "accounting.core": true,
    "reports.core": true,
    "reports.export": true,
    "reports.export.email": true,
    "uploads.manage": true,
    "ai.use": true,
    "webhooks.manage": true,
    "portal.core": true,
    "portal.manage": true,
    "projects.core": true,
    "hr.core": true,
    "inventory.core": true,
    "team.members.manage": true,
    "seats.visibility": true,
    "analytics.advanced": true,
    "playbooks.manage": true,
    "workflows.manage": true,
    "plan.gating": true,
  },
  enterprise: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": true,
    "billing.checkout": true,
    "billing.status.view": true,
    "crm.core": true,
    "accounting.core": true,
    "reports.core": true,
    "reports.export": true,
    "reports.export.email": true,
    "uploads.manage": true,
    "ai.use": true,
    "webhooks.manage": true,
    "portal.core": true,
    "portal.manage": true,
    "projects.core": true,
    "hr.core": true,
    "inventory.core": true,
    "team.members.manage": true,
    "seats.visibility": true,
    "analytics.advanced": true,
    "playbooks.manage": true,
    "workflows.manage": true,
    "plan.gating": true,
  },
}

export type BillingOrgLike = {
  id?: string | null
  name?: string | null
  billingPlan?: string | null
  billingStatus?: string | null
  billingCycle?: string | null
  billingEmail?: string | null
  paymentProvider?: string | null
  paymentCustomerRef?: string | null
  paymentSubscriptionRef?: string | null
  trialEndsAt?: Date | string | null
  seatLimit?: number | null
}

export type BillingFeatureDecision = {
  feature: BillingFeature
  plan: BillingPlan
  status: BillingStatus
  enabled: boolean
  planAllowed: boolean
  statusAllowed: boolean
  reason: string | null
}

export type SeatAvailability = {
  limit: number
  used: number
  remaining: number
  reached: boolean
  nextSeatCount: number
}

export const normalizeBillingPlan = (value?: string | null): BillingPlan => {
  const normalized = String(value || "").trim().toLowerCase()
  return BILLING_PLANS.includes(normalized as BillingPlan) ? (normalized as BillingPlan) : "trial"
}

export const normalizeBillingStatus = (value?: string | null): BillingStatus => {
  const normalized = String(value || "").trim().toLowerCase()
  return BILLING_STATUSES.includes(normalized as BillingStatus) ? (normalized as BillingStatus) : "trial"
}

export const normalizeBillingCycle = (value?: string | null): BillingCycle => {
  const normalized = String(value || "").trim().toLowerCase()
  return BILLING_CYCLES.includes(normalized as BillingCycle) ? (normalized as BillingCycle) : "monthly"
}

export const getDefaultTrialEndsAt = (baseDate = new Date()) => {
  const trialEndsAt = new Date(baseDate)
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)
  return trialEndsAt
}

export const getBillingProviderReadiness = () => ({
  paystack: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY),
  flutterwave: Boolean(process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_PUBLIC_KEY),
  stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
})

export const isTrialExpired = (org: BillingOrgLike) => {
  if (!org.trialEndsAt) return false
  const trialEndsAt = new Date(org.trialEndsAt)
  return Number.isFinite(trialEndsAt.getTime()) && trialEndsAt.getTime() < Date.now()
}

export const hasBillingFeature = (org: BillingOrgLike, feature: BillingFeature) => {
  const plan = normalizeBillingPlan(org.billingPlan)
  return BILLING_FEATURE_MATRIX[plan][feature]
}

export const isBillingSuspended = (org: BillingOrgLike) => normalizeBillingStatus(org.billingStatus) === "suspended"

const getStatusBlockReason = (org: BillingOrgLike, feature: BillingFeature) => {
  if (ALWAYS_AVAILABLE_BILLING_FEATURES.has(feature)) {
    return null
  }

  const status = normalizeBillingStatus(org.billingStatus)
  if (status === "active") return null

  if (status === "trial") {
    return isTrialExpired(org) ? "Trial has expired for this workspace." : null
  }

  if (status === "past_due") {
    return "Billing is past due for this workspace."
  }

  if (status === "suspended") {
    return "Billing is suspended for this workspace."
  }

  if (status === "canceled") {
    return "Billing is canceled for this workspace."
  }

  return "Billing state does not allow this feature right now."
}

export const getBillingFeatureDecision = (org: BillingOrgLike, feature: BillingFeature): BillingFeatureDecision => {
  const plan = normalizeBillingPlan(org.billingPlan)
  const status = normalizeBillingStatus(org.billingStatus)
  const planAllowed = BILLING_FEATURE_MATRIX[plan][feature]
  const statusReason = getStatusBlockReason(org, feature)
  const statusAllowed = !statusReason
  const reason = planAllowed
    ? statusReason
    : `${BILLING_PLAN_LABELS[plan]} does not include ${feature.replace(/\./g, " ")}.`

  return {
    feature,
    plan,
    status,
    enabled: planAllowed && statusAllowed,
    planAllowed,
    statusAllowed,
    reason,
  }
}

export const canUseBillingFeature = (org: BillingOrgLike, feature: BillingFeature) =>
  getBillingFeatureDecision(org, feature).enabled

export const getBillingFeatureAvailability = (org: BillingOrgLike) =>
  BILLING_FEATURES.reduce(
    (acc, feature) => {
      acc[feature] = getBillingFeatureDecision(org, feature)
      return acc
    },
    {} as Record<BillingFeature, BillingFeatureDecision>,
  )

export const getSeatAvailability = (org: BillingOrgLike, usedSeats: number, seatsToAdd = 0): SeatAvailability => {
  const limit = Math.max(Number(org.seatLimit || 0) || 0, 1)
  const used = Math.max(usedSeats, 0)
  const nextSeatCount = used + Math.max(seatsToAdd, 0)
  const remaining = Math.max(limit - used, 0)

  return {
    limit,
    used,
    remaining,
    reached: nextSeatCount > limit,
    nextSeatCount,
  }
}

export const assertBillingFeatureAccess = async ({
  request,
  org,
  user,
  feature,
}: {
  request: Request
  org: BillingOrgLike
  user: { id?: string | null; email?: string | null; role?: string | null }
  feature: BillingFeature
}) => {
  const decision = getBillingFeatureDecision(org, feature)
  if (decision.enabled) {
    return decision
  }

  void logServerEvent({
    level: "warning",
    category: "billing",
    action: "billing.feature.denied",
    message: `Billing blocked access to ${feature}.`,
    request,
    actor: { id: user.id || null, email: user.email || null, role: user.role || null },
    orgId: org.id || null,
    metadata: {
      feature,
      plan: decision.plan,
      status: decision.status,
      reason: decision.reason,
    },
  })

  throw new RequestUserError(decision.reason || "Billing state does not allow this feature.", 403)
}

export const assertSeatCapacity = async ({
  request,
  org,
  user,
  usedSeats,
  seatsToAdd = 1,
}: {
  request: Request
  org: BillingOrgLike
  user: { id?: string | null; email?: string | null; role?: string | null }
  usedSeats: number
  seatsToAdd?: number
}) => {
  const seatStatus = getSeatAvailability(org, usedSeats, seatsToAdd)
  if (!seatStatus.reached) {
    return seatStatus
  }

  void logServerEvent({
    level: "warning",
    category: "billing",
    action: "billing.seat_limit.reached",
    message: "Seat limit blocked a user-management action.",
    request,
    actor: { id: user.id || null, email: user.email || null, role: user.role || null },
    orgId: org.id || null,
    metadata: {
      seatLimit: seatStatus.limit,
      seatsUsed: seatStatus.used,
      seatsRequested: seatStatus.nextSeatCount,
    },
  })

  await createAuditLog({
    orgId: org.id || "",
    userId: user.id || null,
    action: "billing.seat_limit.blocked",
    entity: "Org",
    entityId: org.id || null,
    metadata: {
      seatLimit: seatStatus.limit,
      seatsUsed: seatStatus.used,
      seatsRequested: seatStatus.nextSeatCount,
      actorEmail: user.email || null,
      actorRole: user.role || null,
    },
  })

  throw new RequestUserError(
    `Seat limit reached for this workspace. ${seatStatus.used}/${seatStatus.limit} seats are already in use.`,
    409,
  )
}

export const getBillingConfigurationState = (org: BillingOrgLike) => {
  const status = normalizeBillingStatus(org.billingStatus)
  const provider = String(org.paymentProvider || "").trim().toLowerCase()
  const hasProvider = Boolean(provider)
  const hasRefs = Boolean(org.paymentCustomerRef || org.paymentSubscriptionRef)
  const readiness = getBillingProviderReadiness()
  const providerConfigured =
    !provider ||
    (provider === "paystack" && readiness.paystack) ||
    (provider === "flutterwave" && readiness.flutterwave) ||
    (provider === "stripe" && readiness.stripe)

  return {
    status,
    provider,
    hasProvider,
    hasRefs,
    providerConfigured,
    paymentsConfigured: hasProvider && providerConfigured && hasRefs,
    planGatingEnabled: hasBillingFeature(org, "plan.gating"),
  }
}

export const getBillingReadinessSummary = (org: BillingOrgLike) => {
  const state = getBillingConfigurationState(org)
  const trialEndsAt = org.trialEndsAt ? new Date(org.trialEndsAt) : null
  const trialExpired = isTrialExpired(org)
  return {
    ...state,
    trialEndsAt,
    trialExpired,
    seatLimit: org.seatLimit || 0,
    liveCheckoutImplemented: false,
    webhookLifecycleImplemented: false,
  }
}
