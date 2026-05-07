import { NextResponse } from "next/server"
import { logServerEvent } from "@/lib/observability"
import { isDevelopment } from "@/lib/runtime-flags"

export type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
  status: number
  reason: "allowed" | "exceeded" | "missing-store" | "store-error"
  degraded: boolean
  store: "memory" | "upstash"
  message?: string
}

type RateLimitOptions = {
  limit: number
  windowMs: number
  strictInProduction?: boolean
  action?: string
}

const buckets = new Map<string, { count: number; resetAt: number }>()
const warnedMissingStore = new Set<string>()

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "") || ""
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || ""
const sharedStoreMode = process.env.RATE_LIMIT_STORE?.trim().toLowerCase() || ""

const shouldUseUpstash = Boolean(
  upstashUrl &&
    upstashToken &&
    (sharedStoreMode === "upstash" || sharedStoreMode === "shared" || (!isDevelopment && sharedStoreMode !== "memory")),
)

const strictByDefault = (options: RateLimitOptions) =>
  isDevelopment ? false : options.strictInProduction !== false

const now = () => Date.now()

const createAllowed = (
  remaining: number,
  resetAt: number,
  store: "memory" | "upstash",
  degraded = false,
): RateLimitResult => ({
  ok: true,
  remaining,
  resetAt,
  status: 200,
  reason: "allowed",
  degraded,
  store,
})

const createFailure = (
  status: number,
  reason: RateLimitResult["reason"],
  resetAt: number,
  store: "memory" | "upstash",
  message: string,
  degraded = false,
): RateLimitResult => ({
  ok: false,
  remaining: 0,
  resetAt,
  status,
  reason,
  message,
  degraded,
  store,
})

const warnMissingSharedStore = (action: string) => {
  if (warnedMissingStore.has(action)) return
  warnedMissingStore.add(action)
  void logServerEvent({
    level: "warning",
    category: "rate_limit",
    action: "rate_limit.shared_store_missing",
    message: `Shared rate limiting is not configured for ${action}.`,
    metadata: {
      expectedEnv: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "RATE_LIMIT_STORE=upstash"],
    },
  })
}

const memoryRateLimit = (key: string, options: RateLimitOptions, degraded = false): RateLimitResult => {
  const timestamp = now()
  const existing = buckets.get(key)
  if (!existing || timestamp > existing.resetAt) {
    const next = { count: 1, resetAt: timestamp + options.windowMs }
    buckets.set(key, next)
    return createAllowed(options.limit - 1, next.resetAt, "memory", degraded)
  }
  if (existing.count >= options.limit) {
    return createFailure(429, "exceeded", existing.resetAt, "memory", "Rate limit exceeded", degraded)
  }
  existing.count += 1
  buckets.set(key, existing)
  return createAllowed(options.limit - existing.count, existing.resetAt, "memory", degraded)
}

const upstashRateLimit = async (key: string, options: RateLimitOptions): Promise<RateLimitResult> => {
  const response = await fetch(`${upstashUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${upstashToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, options.windowMs, "NX"],
      ["PTTL", key],
    ]),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed with status ${response.status}`)
  }

  const payload = (await response.json()) as Array<{ result?: unknown }>
  const count = Number(payload?.[0]?.result ?? 0)
  const ttl = Number(payload?.[2]?.result ?? options.windowMs)
  const resetAt = now() + (ttl > 0 ? ttl : options.windowMs)

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("Upstash rate limit returned an invalid counter")
  }

  if (count > options.limit) {
    return createFailure(429, "exceeded", resetAt, "upstash", "Rate limit exceeded")
  }

  return createAllowed(Math.max(options.limit - count, 0), resetAt, "upstash")
}

export const rateLimit = async (key: string, options: RateLimitOptions): Promise<RateLimitResult> => {
  const strict = strictByDefault(options)
  const action = options.action || key.split(":")[0] || "rate-limit"

  if (shouldUseUpstash) {
    try {
      return await upstashRateLimit(key, options)
    } catch (error) {
      void logServerEvent({
        level: strict ? "error" : "warning",
        category: "rate_limit",
        action: "rate_limit.shared_store_error",
        message: `Shared rate limiting failed for ${action}.`,
        metadata: { action },
        error,
      })

      if (strict) {
        return createFailure(
          503,
          "store-error",
          now() + options.windowMs,
          "upstash",
          "Rate limiting is temporarily unavailable for this route.",
        )
      }

      return memoryRateLimit(key, options, true)
    }
  }

  if (!isDevelopment) {
    warnMissingSharedStore(action)
    if (strict) {
      return createFailure(
        503,
        "missing-store",
        now() + options.windowMs,
        "memory",
        "Shared rate limiting is not configured for this route.",
      )
    }
  }

  return memoryRateLimit(key, options, !isDevelopment)
}

export const getRequestIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0].trim()
  return (
    ip ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  )
}

export const getRateLimitKey = (
  request: Request,
  scope: string,
  parts?: {
    userId?: string | null
    orgId?: string | null
    sessionId?: string | null
    code?: string | null
    extra?: string | null
  },
) => {
  const ip = getRequestIp(request)
  return [
    scope,
    parts?.orgId || "org:anon",
    parts?.userId || "user:anon",
    parts?.sessionId || "session:anon",
    parts?.code || "code:none",
    parts?.extra || "extra:none",
    `ip:${ip}`,
  ].join(":")
}

export const retryAfterSeconds = (resetAt: number) => Math.max(1, Math.ceil((resetAt - now()) / 1000))

export const createRateLimitErrorResponse = (
  result: RateLimitResult,
  messages: {
    exceeded: string
    unavailable?: string
  },
) =>
  NextResponse.json(
    {
      error:
        result.reason === "exceeded"
          ? messages.exceeded
          : messages.unavailable || result.message || "Rate limiting is temporarily unavailable.",
    },
    {
      status: result.reason === "exceeded" ? 429 : result.status || 503,
      headers: {
        "Retry-After": retryAfterSeconds(result.resetAt).toString(),
      },
    },
  )

export const getRateLimitReadiness = () => ({
  store: shouldUseUpstash ? "upstash" : "memory",
  sharedStoreConfigured: Boolean(upstashUrl && upstashToken),
  upstashRestUrl: Boolean(upstashUrl),
  upstashRestToken: Boolean(upstashToken),
  productionSafe: shouldUseUpstash || isDevelopment,
})
