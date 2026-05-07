# Civis Rate Limiting Production Setup

Updated: 2026-05-07

## Required env vars

- `RATE_LIMIT_STORE`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Recommended production setting:

```env
RATE_LIMIT_STORE=upstash
```

## Why this matters

Memory-only limiting is not acceptable for multi-instance production because:

- counters reset on restart
- limits do not coordinate across replicas
- one noisy route can bypass protection by hitting different instances

## Current production behavior if shared store is missing

Strict production routes fail closed or return a protection/configuration error instead of silently relying on weak memory-only limiting.

This affects routes such as:

- auth-sensitive endpoints
- portal access-code routes
- portal approval routes
- uploads
- exports
- AI endpoints
- billing checkout
- billing webhook
- destructive admin actions

## Setup steps

1. Provision Upstash Redis or another compatible shared limiter backend
2. Set:
   - `RATE_LIMIT_STORE=upstash`
   - `UPSTASH_REDIS_REST_URL=<provider-url>`
   - `UPSTASH_REDIS_REST_TOKEN=<provider-token>`
3. Redeploy the app
4. Verify the app no longer reports rate-limit protection as unavailable

## How to test auth rate limiting

1. Repeatedly call a protected auth-related endpoint such as login precheck
2. Confirm the route eventually returns a clear rate-limit response
3. Confirm the same limit is still enforced across repeated requests after page refreshes or on another instance if applicable

## How to test portal code rate limiting

1. Rapidly hit `/api/portal/<code>`
2. Confirm the route returns a rate-limit response
3. Repeat from the same client and confirm the limiter persists beyond a single local process

## How to test upload/export/AI rate limiting

Test these routes with repeated calls:

- `/api/uploads/cloudinary`
- `/api/reports/export`
- `/api/ai/chat`

Expected:

- repeated requests hit the limiter
- the response is explicit
- no fallback to `x-user-email` or other spoofable headers is involved

## How to test billing webhook rate limiting

1. Send repeated webhook POSTs to `/api/billing/webhook`
2. Confirm the limiter engages before allowing abuse
3. Confirm invalid signatures are still rejected even before rate limits are exhausted

## Operational rule

Do not call Civis production-ready while `RATE_LIMIT_STORE` is unset for a multi-instance deployment.
