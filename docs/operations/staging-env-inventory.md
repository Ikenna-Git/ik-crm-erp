# Civis Staging Environment Inventory

Updated: 2026-05-08

This inventory was built from local file inspection only.

Sources inspected:

- `.env.local`
- `.env`
- `.env.production.example`
- `.enc.local`

Render access status:

- `UNKNOWN`
- no Render CLI/config was available in this workspace during this inventory pass

Status meanings:

- `PRESENT`
- `MISSING`
- `EMPTY`
- `PLACEHOLDER`
- `UNKNOWN`

Important:

- this file contains no secret values
- a key marked `PRESENT` means it was found in a local source, not that it is confirmed in Render
- a key marked `PLACEHOLDER` means it was found only as a template/example or clearly non-live stub

## Inventory

| Key | Status | Source | What it is for | Validation group |
|---|---|---|---|---|
| `DATABASE_URL` | `PRESENT` | `.env.local` | database connection | app boot |
| `NEXTAUTH_URL` | `PRESENT` | `.env.local` | auth callback base URL | app boot |
| `PUBLIC_APP_URL` | `PLACEHOLDER` | `.env.production.example` | absolute public app origin | app boot |
| `NEXT_PUBLIC_APP_URL` | `PLACEHOLDER` | `.env.production.example` | client-visible app origin | app boot |
| `NEXTAUTH_SECRET` | `PRESENT` | `.env.local` | session/auth signing secret | app boot |
| `ALLOW_DEV_HEADER_IDENTITY` | `PLACEHOLDER` | `.env.production.example` | must stay off outside dev | P0 validation |
| `ALLOW_DEV_DEFAULT_IDENTITY` | `PLACEHOLDER` | `.env.production.example` | must stay off outside dev | P0 validation |
| `NEXTAUTH_ALLOW_DEV_FALLBACK` | `PLACEHOLDER` | `.env.production.example` | must stay off outside dev | P0 validation |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `PLACEHOLDER` | `.env.production.example` | must stay off outside dev | P0 validation |
| `RATE_LIMIT_STORE` | `PLACEHOLDER` | `.env.production.example` | shared rate-limit backend selector | P0 validation |
| `UPSTASH_REDIS_REST_URL` | `PLACEHOLDER` | `.env.production.example` | shared rate-limit store URL | P0 validation |
| `UPSTASH_REDIS_REST_TOKEN` | `PLACEHOLDER` | `.env.production.example` | shared rate-limit store token | P0 validation |
| `OBSERVABILITY_WEBHOOK_URL` | `PLACEHOLDER` | `.env.production.example` | generic observability sink | P0 validation |
| `SECURITY_EVENTS_WEBHOOK_URL` | `PLACEHOLDER` | `.env.production.example` | security event sink | P0 validation |
| `ERROR_ALERT_WEBHOOK_URL` | `PLACEHOLDER` | `.env.production.example` | error alert sink | P0 validation |
| `SENTRY_DSN` | `PLACEHOLDER` | `.env.production.example` | optional Sentry integration | optional validation |
| `SMTP_HOST` | `PRESENT` | `.env.local` | email transport host | email |
| `SMTP_PORT` | `PRESENT` | `.env.local` | email transport port | email |
| `SMTP_USER` | `PRESENT` | `.env.local` | email transport user | email |
| `SMTP_PASS` | `PRESENT` | `.env.local` | email transport password | email |
| `SMTP_FROM` | `PRESENT` | `.env.local` | sender identity | email |
| `CLOUDINARY_CLOUD_NAME` | `PRESENT` | `.env.local` | upload provider cloud name | uploads |
| `CLOUDINARY_API_KEY` | `PRESENT` | `.env.local` | upload provider API key | uploads |
| `CLOUDINARY_API_SECRET` | `PRESENT` | `.env.local` | upload provider API secret | uploads |
| `GOOGLE_CLIENT_ID` | `PLACEHOLDER` | `.env.production.example` | Google sign-in client ID | optional validation |
| `GOOGLE_CLIENT_SECRET` | `PLACEHOLDER` | `.env.production.example` | Google sign-in client secret | optional validation |
| `AI_PROVIDER` | `PRESENT` | `.env.local` | AI provider selector | AI |
| `OPENAI_API_KEY` | `PRESENT` | `.env.local` | OpenAI access | AI |
| `ANTHROPIC_API_KEY` | `PRESENT` | `.env.local` | Anthropic access | AI |
| `GEMINI_API_KEY` | `PRESENT` | `.env.local` | Gemini access | AI |
| `BILLING_PROVIDER_DEFAULT` | `PLACEHOLDER` | `.env.production.example` | default billing provider | billing |
| `STRIPE_SECRET_KEY` | `PLACEHOLDER` | `.env.production.example` | Stripe server key | billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `PLACEHOLDER` | `.env.production.example` | Stripe public client key | billing |
| `STRIPE_WEBHOOK_SECRET` | `PLACEHOLDER` | `.env.production.example` | Stripe webhook signature secret | billing |
| `STRIPE_PRICE_STARTER_MONTHLY` | `PLACEHOLDER` | `.env.production.example` | Stripe starter monthly price ID | billing |
| `STRIPE_PRICE_STARTER_QUARTERLY` | `PLACEHOLDER` | `.env.production.example` | Stripe starter quarterly price ID | billing |
| `STRIPE_PRICE_STARTER_ANNUAL` | `PLACEHOLDER` | `.env.production.example` | Stripe starter annual price ID | billing |
| `STRIPE_PRICE_PROFESSIONAL_MONTHLY` | `PLACEHOLDER` | `.env.production.example` | Stripe professional monthly price ID | billing |
| `STRIPE_PRICE_PROFESSIONAL_QUARTERLY` | `PLACEHOLDER` | `.env.production.example` | Stripe professional quarterly price ID | billing |
| `STRIPE_PRICE_PROFESSIONAL_ANNUAL` | `PLACEHOLDER` | `.env.production.example` | Stripe professional annual price ID | billing |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | `PLACEHOLDER` | `.env.production.example` | Stripe enterprise monthly price ID | billing |
| `STRIPE_PRICE_ENTERPRISE_QUARTERLY` | `PLACEHOLDER` | `.env.production.example` | Stripe enterprise quarterly price ID | billing |
| `STRIPE_PRICE_ENTERPRISE_ANNUAL` | `PLACEHOLDER` | `.env.production.example` | Stripe enterprise annual price ID | billing |

## 1. Present and ready

Found locally and non-placeholder:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`

## 2. Present but looks like placeholder/empty

Found only as template/example or otherwise not confirmed as staging-ready:

- `PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `ALLOW_DEV_HEADER_IDENTITY`
- `ALLOW_DEV_DEFAULT_IDENTITY`
- `NEXTAUTH_ALLOW_DEV_FALLBACK`
- `NEXT_PUBLIC_ENABLE_DEMO_MODE`
- `RATE_LIMIT_STORE`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OBSERVABILITY_WEBHOOK_URL`
- `SECURITY_EVENTS_WEBHOOK_URL`
- `ERROR_ALERT_WEBHOOK_URL`
- `SENTRY_DSN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BILLING_PROVIDER_DEFAULT`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- all `STRIPE_PRICE_*` keys listed above

## 3. Missing and required for staging boot

No requested boot key was completely absent from all inspected files, but these are effectively not staging-ready because they are only placeholders:

- `PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_URL`

## 4. Missing and required for P0 validation

No requested P0 key was completely absent from all inspected files, but these are effectively not staging-ready because they are only placeholders:

- `ALLOW_DEV_HEADER_IDENTITY`
- `ALLOW_DEV_DEFAULT_IDENTITY`
- `NEXTAUTH_ALLOW_DEV_FALLBACK`
- `NEXT_PUBLIC_ENABLE_DEMO_MODE`
- `RATE_LIMIT_STORE`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `OBSERVABILITY_WEBHOOK_URL`
- `SECURITY_EVENTS_WEBHOOK_URL`
- `ERROR_ALERT_WEBHOOK_URL`

## 5. Missing but optional

No requested optional key was completely absent from all inspected files, but these remain optional-and-unconfigured because they are only placeholders:

- `SENTRY_DSN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `BILLING_PROVIDER_DEFAULT`
- all Stripe billing keys

## 6. Must be false in staging/production

These must be explicitly set to `false` in staging/production:

- `ALLOW_DEV_HEADER_IDENTITY`
- `ALLOW_DEV_DEFAULT_IDENTITY`
- `NEXTAUTH_ALLOW_DEV_FALLBACK`
- `NEXT_PUBLIC_ENABLE_DEMO_MODE`
