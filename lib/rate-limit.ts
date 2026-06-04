type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

type RateLimitOptions = {
  limit: number
  windowMs: number
}

// In-memory fallback only. This is fine for local development and single-instance
// deployments, but multi-instance production should swap this for a shared store
// such as Redis/Upstash using the same key contract.
const buckets = new Map<string, { count: number; resetAt: number }>()

export const rateLimit = (key: string, options: RateLimitOptions): RateLimitResult => {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || now > existing.resetAt) {
    const next = { count: 1, resetAt: now + options.windowMs }
    buckets.set(key, next)
    return { ok: true, remaining: options.limit - 1, resetAt: next.resetAt }
  }
  if (existing.count >= options.limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }
  existing.count += 1
  buckets.set(key, existing)
  return { ok: true, remaining: options.limit - existing.count, resetAt: existing.resetAt }
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

export const retryAfterSeconds = (resetAt: number) => Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
