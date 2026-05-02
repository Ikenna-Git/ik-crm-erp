export const BILLING_PLANS = ["trial", "starter", "professional", "enterprise"] as const
export const BILLING_STATUSES = ["trial", "active", "past_due", "suspended", "canceled"] as const
export const BILLING_CYCLES = ["monthly", "quarterly", "annual", "custom"] as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type BillingStatus = (typeof BILLING_STATUSES)[number]
export type BillingCycle = (typeof BILLING_CYCLES)[number]

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
