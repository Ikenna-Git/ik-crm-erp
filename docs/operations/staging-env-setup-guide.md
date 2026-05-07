# Civis Staging Environment Setup Guide

Updated: 2026-05-07

Source of truth:

- [.env.production.example](/Users/mac/Documents/code/.env.production.example)

Rules:

- do not commit real secrets to git
- configure secrets in the hosting platform or secure secret manager
- blank optional values do **not** mean the related validation passed
- blank optional values mean the related smoke test is blocked until configured
- Stripe in staging must use **test** keys only
- dev/demo fallback flags must be `false` in staging and production

## 1. Required now for app boot

These are the minimum values needed to boot a realistic staging app:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `PUBLIC_APP_URL`
- `NEXTAUTH_SECRET`
- `NODE_ENV=production`

Notes:

- `DATABASE_URL` must point to the staging database, not local
- `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`, and `PUBLIC_APP_URL` should all match the staging base URL

## 2. Required for P0/security validation

These are required to validate production-grade protections:

- `RATE_LIMIT_STORE`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OBSERVABILITY_WEBHOOK_URL`
- `SECURITY_EVENTS_WEBHOOK_URL`
- `ERROR_ALERT_WEBHOOK_URL`

Optional but recommended for the same validation group:

- `SENTRY_DSN`

Notes:

- without Redis/Upstash, the shared-store rate-limit tests are blocked
- without observability endpoints, denial/error logging tests are blocked

## 3. Required for email validation

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Notes:

- if these are blank, invite/email delivery validation is blocked
- use a staging-safe mailbox or provider account, not a personal production mailbox

## 4. Required for upload validation

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Notes:

- if these are blank, upload validation is blocked

## 5. Required for Google sign-in

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Notes:

- if Google sign-in is part of the staging checklist, these must be configured
- if you are not validating Google sign-in in staging, the related smoke test stays blocked

## 6. Required for AI validation

- `AI_PROVIDER`
- one or more provider keys depending on the selected path:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GEMINI_API_KEY`

Notes:

- if AI remains enabled in staging but no provider key is configured, AI validation is blocked
- if you intentionally do not want AI in staging, disable or avoid AI validation explicitly rather than treating it as passed

## 7. Required for Stripe billing validation

- `BILLING_PROVIDER_DEFAULT`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER_MONTHLY`
- `STRIPE_PRICE_STARTER_QUARTERLY`
- `STRIPE_PRICE_STARTER_ANNUAL`
- `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PROFESSIONAL_QUARTERLY`
- `STRIPE_PRICE_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `STRIPE_PRICE_ENTERPRISE_QUARTERLY`
- `STRIPE_PRICE_ENTERPRISE_ANNUAL`

Notes:

- staging must use Stripe **test** keys
- `BILLING_PROVIDER_DEFAULT` should be set to `stripe` if Stripe is the active validation path
- the webhook endpoint must also be registered in the Stripe dashboard
- missing price IDs mean checkout validation is blocked

## 8. Optional / can stay blank temporarily

These can remain blank only if you are not validating that feature yet:

- `SENTRY_DSN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_SECRET_KEY`

Important:

- blank optional values do **not** count as success
- blank optional values mean the corresponding smoke test is blocked and must be recorded as blocked in the staging run log

## 9. Must be false in staging/production

These must remain disabled:

- `ALLOW_DEV_HEADER_IDENTITY=false`
- `ALLOW_DEV_DEFAULT_IDENTITY=false`
- `NEXTAUTH_ALLOW_DEV_FALLBACK=false`
- `NEXT_PUBLIC_ENABLE_DEMO_MODE=false`

## Operational reminder

- do not place real secrets in repo files
- do not commit `.env` files
- configure staging secrets in the hosting platform
- record which env groups were configured in [staging-validation-run-log.md](/Users/mac/Documents/code/docs/operations/staging-validation-run-log.md)
