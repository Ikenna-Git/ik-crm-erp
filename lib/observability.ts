import { isDevelopment } from "@/lib/runtime-flags"

export type ObservabilityLevel = "info" | "warning" | "error" | "critical"
export type ObservabilityCategory =
  | "auth"
  | "authorization"
  | "rate_limit"
  | "portal"
  | "billing"
  | "webhook"
  | "export"
  | "upload"
  | "rollback"
  | "audit"
  | "telemetry"
  | "system"

type ActorRef = {
  id?: string | null
  email?: string | null
  role?: string | null
}

type ObservabilityEvent = {
  level: ObservabilityLevel
  category: ObservabilityCategory
  action: string
  message: string
  request?: Request | null
  actor?: ActorRef | null
  orgId?: string | null
  metadata?: Record<string, unknown> | null
  error?: unknown
}

const MAX_STRING = 500
const REDACTED = "[REDACTED]"
const REDACT_KEYS = /(password|secret|token|authorization|cookie|api[-_]?key|refresh|credential|signature)/i

const safeString = (value: string) => (value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value)

const sanitizeValue = (value: unknown, depth = 0): unknown => {
  if (value == null) return value
  if (depth > 4) return "[MaxDepth]"
  if (typeof value === "string") return safeString(value)
  if (typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.slice(0, 25).map((entry) => sanitizeValue(entry, depth + 1))
  if (value instanceof Error) {
    return {
      name: value.name,
      message: safeString(value.message || "Unknown error"),
      stack: safeString(value.stack || ""),
    }
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      if (REDACT_KEYS.test(key)) {
        output[key] = REDACTED
        continue
      }
      output[key] = sanitizeValue(entry, depth + 1)
    }
    return output
  }
  return String(value)
}

const summarizeRequest = (request?: Request | null) => {
  if (!request) return null
  try {
    const url = new URL(request.url)
    return {
      method: request.method,
      path: url.pathname,
      ip: getRequestIp(request),
    }
  } catch {
    return {
      method: request.method,
      path: request.url,
      ip: getRequestIp(request),
    }
  }
}

const getWebhookTargets = (category: ObservabilityCategory) => {
  const targets = new Set<string>()
  if (process.env.OBSERVABILITY_WEBHOOK_URL) targets.add(process.env.OBSERVABILITY_WEBHOOK_URL)
  if (category === "auth" || category === "authorization" || category === "rate_limit") {
    if (process.env.SECURITY_EVENTS_WEBHOOK_URL) targets.add(process.env.SECURITY_EVENTS_WEBHOOK_URL)
  }
  if (category === "rollback" || category === "billing" || category === "webhook" || category === "export") {
    if (process.env.SECURITY_EVENTS_WEBHOOK_URL) targets.add(process.env.SECURITY_EVENTS_WEBHOOK_URL)
  }
  if (category === "telemetry" || category === "system" || category === "upload") {
    if (process.env.ERROR_ALERT_WEBHOOK_URL) targets.add(process.env.ERROR_ALERT_WEBHOOK_URL)
  }
  return [...targets]
}

const emitConsole = (payload: Record<string, unknown>, level: ObservabilityLevel) => {
  const serialized = JSON.stringify(payload)
  if (level === "critical" || level === "error") {
    console.error(serialized)
    return
  }
  if (level === "warning") {
    console.warn(serialized)
    return
  }
  console.info(serialized)
}

const sendWebhook = async (url: string, payload: Record<string, unknown>) => {
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    })
  } catch (error) {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        level: "warning",
        category: "observability",
        action: "webhook.delivery.failed",
        message: "Failed to deliver observability webhook.",
        error: sanitizeValue(error),
      }),
    )
  }
}

export const getObservabilityReadiness = () => ({
  genericWebhook: Boolean(process.env.OBSERVABILITY_WEBHOOK_URL),
  securityWebhook: Boolean(process.env.SECURITY_EVENTS_WEBHOOK_URL),
  errorWebhook: Boolean(process.env.ERROR_ALERT_WEBHOOK_URL),
  sentryDsnPresent: Boolean(process.env.SENTRY_DSN),
})

export const logServerEvent = async ({
  level,
  category,
  action,
  message,
  request,
  actor,
  orgId,
  metadata,
  error,
}: ObservabilityEvent) => {
  const payload = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    level,
    category,
    action,
    message,
    request: summarizeRequest(request),
    actor: actor
      ? {
          id: actor.id || null,
          email: actor.email ? safeString(actor.email) : null,
          role: actor.role || null,
        }
      : null,
    orgId: orgId || null,
    metadata: sanitizeValue(metadata || null),
    error: sanitizeValue(error),
  }

  emitConsole(payload, level)

  if (isDevelopment) {
    return
  }

  const targets = getWebhookTargets(category)
  if (!targets.length) {
    return
  }

  await Promise.all(targets.map((target) => sendWebhook(target, payload)))
}

export const logSecurityEvent = async (event: Omit<ObservabilityEvent, "category">) =>
  logServerEvent({ ...event, category: "authorization" })

export const captureServerError = async ({
  action,
  message,
  request,
  actor,
  orgId,
  metadata,
  error,
}: Omit<ObservabilityEvent, "level" | "category">) =>
  logServerEvent({
    level: "error",
    category: "system",
    action,
    message,
    request,
    actor,
    orgId,
    metadata,
    error,
  })
const getRequestIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0].trim()
  return (
    ip ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}
