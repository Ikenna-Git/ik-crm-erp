type RateLimitResult = {
  ok: boolean
  remaining: number
  resetAt: number
}

type RateLimitOptions = {
  limit: number
  windowMs: number
}

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

export const getRateLimitKey = (request: Request, scope: string) => {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0].trim()
  const email = request.headers.get("x-user-email")?.trim() || ""
  return `${scope}:${ip || "unknown"}:${email}`
}

export const retryAfterSeconds = (resetAt: number) => Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
