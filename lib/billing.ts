export const BILLING_PLANS = ["trial", "starter", "professional", "enterprise"] as const
export const BILLING_STATUSES = ["trial", "active", "past_due", "suspended", "canceled"] as const
export const BILLING_CYCLES = ["monthly", "quarterly", "annual", "custom"] as const
export const BILLING_FEATURES = [
  "billing.settings.manage",
  "billing.provider_refs.manage",
  "reports.export.email",
  "webhooks.manage",
  "seats.visibility",
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

const BILLING_FEATURE_MATRIX: Record<BillingPlan, Record<BillingFeature, boolean>> = {
  trial: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "reports.export.email": false,
    "webhooks.manage": false,
    "seats.visibility": true,
    "plan.gating": false,
  },
  starter: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "reports.export.email": true,
    "webhooks.manage": false,
    "seats.visibility": true,
    "plan.gating": true,
  },
  professional: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": false,
    "reports.export.email": true,
    "webhooks.manage": true,
    "seats.visibility": true,
    "plan.gating": true,
  },
  enterprise: {
    "billing.settings.manage": true,
    "billing.provider_refs.manage": true,
    "reports.export.email": true,
    "webhooks.manage": true,
    "seats.visibility": true,
    "plan.gating": true,
  },
}

type BillingOrgLike = {
  billingPlan?: string | null
  billingStatus?: string | null
  paymentProvider?: string | null
  paymentCustomerRef?: string | null
  paymentSubscriptionRef?: string | null
  trialEndsAt?: Date | string | null
  seatLimit?: number | null
}

export const hasBillingFeature = (org: BillingOrgLike, feature: BillingFeature) => {
  const plan = normalizeBillingPlan(org.billingPlan)
  return BILLING_FEATURE_MATRIX[plan][feature]
}

export const isBillingSuspended = (org: BillingOrgLike) => normalizeBillingStatus(org.billingStatus) === "suspended"

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
  const trialExpired = Boolean(trialEndsAt && trialEndsAt.getTime() < Date.now())
  return {
    ...state,
    trialEndsAt,
    trialExpired,
    seatLimit: org.seatLimit || 0,
    liveCheckoutImplemented: false,
    webhookLifecycleImplemented: false,
  }
}
