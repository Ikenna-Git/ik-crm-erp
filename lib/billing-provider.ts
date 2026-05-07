import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { captureServerError, logServerEvent } from "@/lib/observability"
import {
  BILLING_CYCLE_LABELS,
  BILLING_PLAN_LABELS,
  getBillingFeatureAvailability,
  getBillingReadinessSummary,
  normalizeBillingCycle,
  normalizeBillingPlan,
  normalizeBillingStatus,
  type BillingCycle,
  type BillingOrgLike,
  type BillingPlan,
  type BillingStatus,
} from "@/lib/billing"

export const BILLING_PROVIDER_NAMES = ["stripe", "paystack", "flutterwave"] as const
export type BillingProviderName = (typeof BILLING_PROVIDER_NAMES)[number]
export type BillingLifecycleEventType =
  | "checkout.completed"
  | "subscription.active"
  | "subscription.past_due"
  | "subscription.canceled"
  | "payment.failed"
  | "trial.ended"

export class BillingProviderError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = "billing_provider_error") {
    super(message)
    this.name = "BillingProviderError"
    this.status = status
    this.code = code
  }
}

export const isBillingProviderError = (error: unknown): error is BillingProviderError => error instanceof BillingProviderError

type ProviderState = {
  name: BillingProviderName
  implemented: boolean
  selected: boolean
  envReady: boolean
  checkoutReady: boolean
  webhookReady: boolean
  missing: string[]
  note?: string
}

type CheckoutInput = {
  request: Request
  org: BillingOrgLike & { id: string; name: string }
  actor: { id: string; email: string; role: string; name?: string | null }
  plan?: string | null
  cycle?: string | null
  successUrl?: string | null
  cancelUrl?: string | null
}

type CheckoutResult = {
  provider: BillingProviderName
  sessionId: string
  redirectUrl: string
  customerRef?: string | null
  plan: BillingPlan
  cycle: BillingCycle
}

type BillingLifecycleEvent = {
  provider: BillingProviderName
  type: BillingLifecycleEventType
  eventId: string
  rawType: string
  occurredAt: Date
  orgId?: string | null
  customerRef?: string | null
  subscriptionRef?: string | null
  plan?: BillingPlan | null
  cycle?: BillingCycle | null
  status?: BillingStatus | null
  trialEndsAt?: Date | null
  nextBillingDate?: Date | null
  metadata?: Record<string, unknown> | null
}

const STRIPE_PRICE_KEYS: Record<
  Exclude<BillingPlan, "trial">,
  Partial<Record<Exclude<BillingCycle, "custom">, string>>
> = {
  starter: {
    monthly: "STRIPE_PRICE_STARTER_MONTHLY",
    quarterly: "STRIPE_PRICE_STARTER_QUARTERLY",
    annual: "STRIPE_PRICE_STARTER_ANNUAL",
  },
  professional: {
    monthly: "STRIPE_PRICE_PROFESSIONAL_MONTHLY",
    quarterly: "STRIPE_PRICE_PROFESSIONAL_QUARTERLY",
    annual: "STRIPE_PRICE_PROFESSIONAL_ANNUAL",
  },
  enterprise: {
    monthly: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
    quarterly: "STRIPE_PRICE_ENTERPRISE_QUARTERLY",
    annual: "STRIPE_PRICE_ENTERPRISE_ANNUAL",
  },
}

const STRIPE_REQUIRED_ENV = ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"] as const
const STRIPE_WEBHOOK_ENV = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const

export const normalizeBillingProviderName = (value?: string | null): BillingProviderName | null => {
  const normalized = String(value || "").trim().toLowerCase()
  return BILLING_PROVIDER_NAMES.includes(normalized as BillingProviderName) ? (normalized as BillingProviderName) : null
}

const getSelectedProviderName = (org?: BillingOrgLike | null) =>
  normalizeBillingProviderName(org?.paymentProvider) || normalizeBillingProviderName(process.env.BILLING_PROVIDER_DEFAULT) || null

const getStripePriceEnvKey = (plan: BillingPlan, cycle: BillingCycle) => {
  if (plan === "trial" || cycle === "custom") return null
  return STRIPE_PRICE_KEYS[plan]?.[cycle] || null
}

const getStripePriceId = (plan: BillingPlan, cycle: BillingCycle) => {
  const envKey = getStripePriceEnvKey(plan, cycle)
  return envKey ? String(process.env[envKey] || "").trim() : ""
}

const getProviderStates = (selectedProvider?: BillingProviderName | null): Record<BillingProviderName, ProviderState> => {
  const stripeMissing = STRIPE_REQUIRED_ENV.filter((key) => !process.env[key])
  const stripeHasAnyPrice = Object.values(STRIPE_PRICE_KEYS)
    .flatMap((entry) => Object.values(entry))
    .some((envKey) => Boolean(envKey && process.env[envKey]))

  return {
    stripe: {
      name: "stripe",
      implemented: true,
      selected: selectedProvider === "stripe",
      envReady: stripeMissing.length === 0,
      checkoutReady: stripeMissing.length === 0 && stripeHasAnyPrice,
      webhookReady: STRIPE_WEBHOOK_ENV.every((key) => Boolean(process.env[key])),
      missing: [
        ...stripeMissing,
        ...(stripeHasAnyPrice ? [] : ["STRIPE_PRICE_<PLAN>_<CYCLE>"]),
        ...(process.env.STRIPE_WEBHOOK_SECRET ? [] : ["STRIPE_WEBHOOK_SECRET"]),
      ],
    },
    paystack: {
      name: "paystack",
      implemented: false,
      selected: selectedProvider === "paystack",
      envReady: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY),
      checkoutReady: false,
      webhookReady: false,
      missing: [
        ...(process.env.PAYSTACK_SECRET_KEY ? [] : ["PAYSTACK_SECRET_KEY"]),
        ...(process.env.PAYSTACK_PUBLIC_KEY ? [] : ["PAYSTACK_PUBLIC_KEY"]),
      ],
      note: "Provider placeholder only. Checkout and verified webhooks are not wired yet.",
    },
    flutterwave: {
      name: "flutterwave",
      implemented: false,
      selected: selectedProvider === "flutterwave",
      envReady: Boolean(process.env.FLUTTERWAVE_SECRET_KEY && process.env.FLUTTERWAVE_PUBLIC_KEY),
      checkoutReady: false,
      webhookReady: false,
      missing: [
        ...(process.env.FLUTTERWAVE_SECRET_KEY ? [] : ["FLUTTERWAVE_SECRET_KEY"]),
        ...(process.env.FLUTTERWAVE_PUBLIC_KEY ? [] : ["FLUTTERWAVE_PUBLIC_KEY"]),
      ],
      note: "Provider placeholder only. Checkout and verified webhooks are not wired yet.",
    },
  }
}

const getRequestOrigin = (request?: Request | null) => {
  const publicUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.PUBLIC_APP_URL?.trim() ||
    ""
  if (publicUrl) return publicUrl.replace(/\/+$/, "")

  if (!request) return ""
  try {
    const url = new URL(request.url)
    return `${url.protocol}//${url.host}`.replace(/\/+$/, "")
  } catch {
    return ""
  }
}

const ensureAbsoluteUrl = (value: string | null | undefined, fallbackPath: string, request?: Request | null) => {
  const raw = String(value || "").trim()
  if (raw) {
    try {
      const parsed = new URL(raw)
      return parsed.toString()
    } catch {
      // fall through to origin-based build
    }
  }

  const origin = getRequestOrigin(request)
  if (!origin) {
    throw new BillingProviderError("Public app URL is not configured for billing checkout.", 503, "billing_origin_missing")
  }
  return `${origin}${fallbackPath}`
}

const stripeFetch = async (path: string, body: URLSearchParams) => {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new BillingProviderError("Stripe secret key is missing.", 503, "stripe_secret_missing")
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null
  if (!response.ok) {
    const message = String(payload?.error && typeof payload.error === "object" ? (payload.error as { message?: string }).message : "") ||
      `Stripe request failed with status ${response.status}`
    throw new BillingProviderError(message, 502, "stripe_request_failed")
  }

  return payload || {}
}

const createStripeCheckout = async ({ request, org, actor, plan, cycle, successUrl, cancelUrl }: CheckoutInput) => {
  const runtime = getProviderStates("stripe").stripe
  if (!runtime.checkoutReady) {
    throw new BillingProviderError(
      `Stripe checkout is not configured. Missing: ${runtime.missing.join(", ")}`,
      503,
      "stripe_checkout_not_configured",
    )
  }

  const normalizedPlan = normalizeBillingPlan(plan || (org.billingPlan && org.billingPlan !== "trial" ? org.billingPlan : "starter"))
  const normalizedCycle = normalizeBillingCycle(cycle || org.billingCycle || "monthly")

  if (normalizedPlan === "trial") {
    throw new BillingProviderError("Checkout requires a paid billing plan.", 400, "billing_plan_required")
  }

  if (normalizedCycle === "custom") {
    throw new BillingProviderError("Custom billing cycles must be handled manually.", 400, "billing_cycle_unsupported")
  }

  const priceId = getStripePriceId(normalizedPlan, normalizedCycle)
  if (!priceId) {
    const envKey = getStripePriceEnvKey(normalizedPlan, normalizedCycle)
    throw new BillingProviderError(
      `Stripe price ID is missing for ${normalizedPlan} ${normalizedCycle}. Expected ${envKey}.`,
      503,
      "stripe_price_missing",
    )
  }

  const customerRef =
    String(org.paymentCustomerRef || "").trim() ||
    (await (async () => {
      const customerData = new URLSearchParams()
      customerData.set("email", org.billingEmail || actor.email)
      customerData.set("name", org.name)
      customerData.set("metadata[orgId]", org.id)
      customerData.set("metadata[orgName]", org.name)
      customerData.set("metadata[createdBy]", actor.email)
      const created = await stripeFetch("/v1/customers", customerData)
      return String(created.id || "")
    })())

  const sessionData = new URLSearchParams()
  sessionData.set("mode", "subscription")
  sessionData.set("success_url", ensureAbsoluteUrl(successUrl, "/admin/billing?checkout=success", request))
  sessionData.set("cancel_url", ensureAbsoluteUrl(cancelUrl, "/admin/billing?checkout=cancelled", request))
  sessionData.set("customer", customerRef)
  sessionData.set("client_reference_id", org.id)
  sessionData.set("line_items[0][price]", priceId)
  sessionData.set("line_items[0][quantity]", "1")
  sessionData.set("metadata[orgId]", org.id)
  sessionData.set("metadata[orgName]", org.name)
  sessionData.set("metadata[billingPlan]", normalizedPlan)
  sessionData.set("metadata[billingCycle]", normalizedCycle)
  sessionData.set("metadata[actorEmail]", actor.email)
  sessionData.set("subscription_data[metadata][orgId]", org.id)
  sessionData.set("subscription_data[metadata][billingPlan]", normalizedPlan)
  sessionData.set("subscription_data[metadata][billingCycle]", normalizedCycle)

  const session = await stripeFetch("/v1/checkout/sessions", sessionData)
  const sessionId = String(session.id || "")
  const redirectUrl = String(session.url || "")
  if (!sessionId || !redirectUrl) {
    throw new BillingProviderError("Stripe checkout did not return a usable session URL.", 502, "stripe_checkout_invalid")
  }

  return {
    provider: "stripe" as const,
    sessionId,
    redirectUrl,
    customerRef,
    plan: normalizedPlan,
    cycle: normalizedCycle,
  }
}

const secureCompare = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  if (leftBuffer.length !== rightBuffer.length) return false
  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

const verifyStripeWebhook = (rawBody: string, signatureHeader: string | null) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new BillingProviderError("Stripe webhook secret is missing.", 503, "stripe_webhook_secret_missing")
  }

  if (!signatureHeader) {
    throw new BillingProviderError("Stripe signature header is missing.", 400, "stripe_signature_missing")
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((entry) => {
      const [key, value] = entry.split("=")
      return [key, value]
    }),
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) {
    throw new BillingProviderError("Stripe signature header is malformed.", 400, "stripe_signature_invalid")
  }

  const signedPayload = `${timestamp}.${rawBody}`
  const expected = crypto.createHmac("sha256", webhookSecret).update(signedPayload).digest("hex")
  if (!secureCompare(expected, signature)) {
    throw new BillingProviderError("Stripe webhook signature verification failed.", 401, "stripe_signature_mismatch")
  }

  return JSON.parse(rawBody) as Record<string, any>
}

const toDate = (value: unknown) => {
  if (typeof value === "number") return new Date(value * 1000)
  if (typeof value === "string" || value instanceof Date) {
    const parsed = new Date(value)
    return Number.isFinite(parsed.getTime()) ? parsed : null
  }
  return null
}

const buildStripeLifecycleEvents = (event: Record<string, any>): BillingLifecycleEvent[] => {
  const rawType = String(event.type || "")
  const object = event?.data?.object || {}
  const metadata = typeof object.metadata === "object" && object.metadata ? object.metadata : {}
  const orgId = typeof metadata.orgId === "string" ? metadata.orgId : typeof object.client_reference_id === "string" ? object.client_reference_id : null
  const planRaw = typeof metadata.billingPlan === "string" ? metadata.billingPlan : null
  const cycleRaw = typeof metadata.billingCycle === "string" ? metadata.billingCycle : null
  const plan = planRaw ? normalizeBillingPlan(planRaw) : null
  const cycle = cycleRaw ? normalizeBillingCycle(cycleRaw) : null
  const occurredAt = toDate(event.created) || new Date()
  const customerRef = typeof object.customer === "string" ? object.customer : null
  const subscriptionRef =
    typeof object.subscription === "string"
      ? object.subscription
      : typeof object.id === "string" && rawType.startsWith("customer.subscription")
        ? object.id
        : typeof object.subscription === "object" && object.subscription?.id
          ? String(object.subscription.id)
          : null
  const nextBillingDate = toDate(object.current_period_end)
  const trialEndsAt = toDate(object.trial_end)
  const events: BillingLifecycleEvent[] = []

  if (rawType === "checkout.session.completed") {
    events.push({
      provider: "stripe",
      type: "checkout.completed",
      eventId: String(event.id || crypto.randomUUID()),
      rawType,
      occurredAt,
      orgId,
      customerRef,
      subscriptionRef,
      plan,
      cycle,
      metadata: {
        paymentStatus: object.payment_status || null,
        mode: object.mode || null,
      },
    })
  }

  if (rawType === "customer.subscription.created" || rawType === "customer.subscription.updated") {
    const status = String(object.status || "").toLowerCase()
    const previousStatus = String(event?.data?.previous_attributes?.status || "").toLowerCase()
    if (previousStatus === "trialing" && status !== "trialing") {
      events.push({
        provider: "stripe",
        type: "trial.ended",
        eventId: String(event.id || crypto.randomUUID()),
        rawType,
        occurredAt,
        orgId,
        customerRef,
        subscriptionRef,
        plan,
        cycle,
        status:
          status === "active"
            ? "active"
            : status === "past_due" || status === "unpaid" || status === "incomplete"
              ? "past_due"
              : status === "canceled" || status === "incomplete_expired"
                ? "canceled"
                : null,
        nextBillingDate,
        trialEndsAt,
      })
    }

    if (status === "active" || status === "trialing") {
      events.push({
        provider: "stripe",
        type: "subscription.active",
        eventId: String(event.id || crypto.randomUUID()),
        rawType,
        occurredAt,
        orgId,
        customerRef,
        subscriptionRef,
        plan,
        cycle,
        status: status === "trialing" ? "trial" : "active",
        nextBillingDate,
        trialEndsAt,
      })
    } else if (status === "past_due" || status === "unpaid" || status === "incomplete") {
      events.push({
        provider: "stripe",
        type: "subscription.past_due",
        eventId: String(event.id || crypto.randomUUID()),
        rawType,
        occurredAt,
        orgId,
        customerRef,
        subscriptionRef,
        plan,
        cycle,
        status: "past_due",
        nextBillingDate,
        trialEndsAt,
      })
    } else if (status === "canceled" || status === "incomplete_expired") {
      events.push({
        provider: "stripe",
        type: "subscription.canceled",
        eventId: String(event.id || crypto.randomUUID()),
        rawType,
        occurredAt,
        orgId,
        customerRef,
        subscriptionRef,
        plan,
        cycle,
        status: "canceled",
        nextBillingDate,
        trialEndsAt,
      })
    }
  }

  if (rawType === "customer.subscription.deleted") {
    events.push({
      provider: "stripe",
      type: "subscription.canceled",
      eventId: String(event.id || crypto.randomUUID()),
      rawType,
      occurredAt,
      orgId,
      customerRef,
      subscriptionRef,
      plan,
      cycle,
      status: "canceled",
      nextBillingDate,
      trialEndsAt,
    })
  }

  if (rawType === "invoice.payment_failed") {
    events.push({
      provider: "stripe",
      type: "payment.failed",
      eventId: String(event.id || crypto.randomUUID()),
      rawType,
      occurredAt,
      orgId,
      customerRef,
      subscriptionRef,
      plan,
      cycle,
      status: "past_due",
      nextBillingDate,
      trialEndsAt,
    })
  }

  return events
}

export const getBillingProviderRuntimeSummary = (org?: BillingOrgLike | null) => {
  const selectedProvider = getSelectedProviderName(org)
  const states = getProviderStates(selectedProvider)
  const selectedState = selectedProvider ? states[selectedProvider] : null

  return {
    selectedProvider,
    checkoutAvailable: Boolean(selectedState?.implemented && selectedState.checkoutReady),
    webhookAvailable: Boolean(selectedState?.implemented && selectedState.webhookReady),
    states,
    implementedProviders: Object.values(states)
      .filter((entry) => entry.implemented)
      .map((entry) => entry.name),
  }
}

export const createBillingCheckout = async (input: CheckoutInput): Promise<CheckoutResult> => {
  const selectedProvider = getSelectedProviderName(input.org)
  if (!selectedProvider) {
    throw new BillingProviderError(
      "Billing provider not configured. Set org paymentProvider or BILLING_PROVIDER_DEFAULT first.",
      503,
      "billing_provider_not_configured",
    )
  }

  if (selectedProvider !== "stripe") {
    throw new BillingProviderError(
      `${selectedProvider} billing adapter is not implemented yet.`,
      503,
      "billing_provider_not_implemented",
    )
  }

  return createStripeCheckout(input)
}

export const verifyBillingWebhook = async (request: Request) => {
  const rawBody = await request.text()
  const stripeSignature = request.headers.get("stripe-signature")
  const paystackSignature = request.headers.get("x-paystack-signature")
  const flutterwaveSignature = request.headers.get("verif-hash")

  if (stripeSignature) {
    const event = verifyStripeWebhook(rawBody, stripeSignature)
    return { provider: "stripe" as const, events: buildStripeLifecycleEvents(event), rawType: String(event.type || "") }
  }

  if (paystackSignature) {
    throw new BillingProviderError("Paystack webhook verification is not implemented yet.", 503, "paystack_not_implemented")
  }

  if (flutterwaveSignature) {
    throw new BillingProviderError(
      "Flutterwave webhook verification is not implemented yet.",
      503,
      "flutterwave_not_implemented",
    )
  }

  throw new BillingProviderError(
    "Billing webhook signature header is missing or unsupported.",
    400,
    "billing_webhook_signature_missing",
  )
}

const findOrgForLifecycleEvent = async (event: BillingLifecycleEvent) => {
  if (event.orgId) {
    return prisma.org.findUnique({ where: { id: event.orgId } })
  }

  if (event.subscriptionRef) {
    const bySubscription = await prisma.org.findFirst({ where: { paymentSubscriptionRef: event.subscriptionRef } })
    if (bySubscription) return bySubscription
  }

  if (event.customerRef) {
    return prisma.org.findFirst({ where: { paymentCustomerRef: event.customerRef } })
  }

  return null
}

export const applyBillingLifecycleEvent = async ({
  request,
  event,
}: {
  request: Request
  event: BillingLifecycleEvent
}) => {
  const org = await findOrgForLifecycleEvent(event)
  if (!org) {
    void logServerEvent({
      level: "warning",
      category: "billing",
      action: "billing.webhook.org_not_found",
      message: "Billing webhook event could not be matched to a workspace.",
      request,
      metadata: {
        eventId: event.eventId,
        eventType: event.type,
        provider: event.provider,
        orgId: event.orgId,
      },
    })

    return { applied: false, reason: "org_not_found" as const }
  }

  const nextStatus =
    event.type === "subscription.active"
      ? normalizeBillingStatus(event.status || (event.trialEndsAt ? "trial" : "active"))
      : event.type === "subscription.past_due" || event.type === "payment.failed"
        ? "past_due"
        : event.type === "subscription.canceled"
          ? "canceled"
          : event.type === "trial.ended"
            ? normalizeBillingStatus(event.status || "active")
            : normalizeBillingStatus(org.billingStatus)

  const updateData: Record<string, unknown> = {
    paymentProvider: event.provider,
    paymentCustomerRef: event.customerRef || org.paymentCustomerRef || null,
    paymentSubscriptionRef: event.subscriptionRef || org.paymentSubscriptionRef || null,
  }

  if (event.plan && event.plan !== "trial") {
    updateData.billingPlan = event.plan
  }
  if (event.cycle) {
    updateData.billingCycle = event.cycle
  }
  if (event.nextBillingDate !== undefined) {
    updateData.nextBillingDate = event.nextBillingDate
  }
  if (event.trialEndsAt !== undefined) {
    updateData.trialEndsAt = event.trialEndsAt
  }

  if (event.type !== "checkout.completed") {
    updateData.billingStatus = nextStatus
  }

  if (event.type === "subscription.canceled") {
    updateData.nextBillingDate = null
  }

  if (event.type === "trial.ended" && !event.trialEndsAt) {
    updateData.trialEndsAt = event.occurredAt
  }

  const updated = await prisma.org.update({
    where: { id: org.id },
    data: updateData,
  })

  await createAuditLog({
    orgId: org.id,
    action: `billing.webhook.${event.type}`,
    entity: "Org",
    entityId: org.id,
    metadata: {
      provider: event.provider,
      eventId: event.eventId,
      rawType: event.rawType,
      billingPlan: updated.billingPlan,
      billingStatus: updated.billingStatus,
      billingCycle: updated.billingCycle,
      paymentCustomerRef: updated.paymentCustomerRef,
      paymentSubscriptionRef: updated.paymentSubscriptionRef,
    },
  })

  void logServerEvent({
    level: "info",
    category: "billing",
    action: `billing.webhook.${event.type}`,
    message: "Billing webhook event applied to workspace state.",
    request,
    orgId: org.id,
    metadata: {
      eventId: event.eventId,
      rawType: event.rawType,
      provider: event.provider,
      billingPlan: updated.billingPlan,
      billingStatus: updated.billingStatus,
      billingCycle: updated.billingCycle,
    },
  })

  return { applied: true, org: updated }
}

export const getBillingStatusPayload = ({
  org,
  seatsUsed,
}: {
  org: BillingOrgLike & { id: string; name: string; seatLimit?: number | null }
  seatsUsed: number
}) => {
  const readiness = getBillingReadinessSummary(org)
  const providerRuntime = getBillingProviderRuntimeSummary(org)
  const features = getBillingFeatureAvailability(org)
  const limit = Math.max(Number(org.seatLimit || 0) || 0, 1)
  return {
    org: {
      id: org.id,
      name: org.name,
      billingPlan: normalizeBillingPlan(org.billingPlan),
      billingStatus: normalizeBillingStatus(org.billingStatus),
      billingCycle: normalizeBillingCycle(org.billingCycle),
      billingEmail: org.billingEmail || null,
      paymentProvider: org.paymentProvider || null,
      paymentCustomerRef: org.paymentCustomerRef || null,
      paymentSubscriptionRef: org.paymentSubscriptionRef || null,
      trialEndsAt: org.trialEndsAt || null,
      seatLimit: limit,
    },
    seatUsage: {
      used: seatsUsed,
      limit,
      remaining: Math.max(limit - seatsUsed, 0),
      reached: seatsUsed >= limit,
    },
    billingReadiness: {
      ...readiness,
      liveCheckoutImplemented: providerRuntime.checkoutAvailable,
      webhookLifecycleImplemented: providerRuntime.webhookAvailable,
    },
    providerRuntime,
    featureAccess: features,
    planLabel: BILLING_PLAN_LABELS[normalizeBillingPlan(org.billingPlan)],
    cycleLabel: BILLING_CYCLE_LABELS[normalizeBillingCycle(org.billingCycle)],
  }
}

export const captureBillingProviderFailure = ({
  request,
  action,
  orgId,
  error,
  metadata,
}: {
  request?: Request | null
  action: string
  orgId?: string | null
  error: unknown
  metadata?: Record<string, unknown> | null
}) =>
  captureServerError({
    action,
    message: "Billing provider action failed.",
    request,
    orgId,
    metadata,
    error,
  })
