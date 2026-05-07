# Civis Production Deployment Checklist

Updated: 2026-05-07

Use this checklist before promoting Civis to live traffic.

## A. Code-complete items

- auth/admin hardening branch changes are present
- private routes redirect unauthenticated users
- protected APIs reject unauthenticated calls
- admin and rollback routes are server-side protected
- billing status route exists
- checkout route exists and fails closed when provider config is missing
- billing webhook route exists and fails closed when signature or provider config is missing
- server-side plan gating is active for:
  - CRM/accounting/portal/projects/HR/inventory core access by billing state
  - AI
  - uploads
  - report exports
  - webhooks
  - playbooks/workflows
  - team management / seat-limit checks
- `npm run lint` passes
- `npm run build` passes

## B. Environment-required items

- `NEXTAUTH_URL` is set to the real production domain
- `NEXTAUTH_SECRET` is set and rotated appropriately
- `DATABASE_URL` points to the correct production database
- shared rate limiting envs are configured:
  - `RATE_LIMIT_STORE`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
- observability/alerting envs are configured and tested:
  - `OBSERVABILITY_WEBHOOK_URL`
  - `SECURITY_EVENTS_WEBHOOK_URL`
  - `ERROR_ALERT_WEBHOOK_URL`
  - optional `SENTRY_DSN`
- SMTP is configured and tested
- Cloudinary is configured and tested
- AI provider keys are configured if AI is enabled
- no local-dev fallback flags are enabled:
  - `ALLOW_DEV_HEADER_IDENTITY=false`
  - `ALLOW_DEV_DEFAULT_IDENTITY=false`
  - `NEXTAUTH_ALLOW_DEV_FALLBACK=false`
  - `NEXT_PUBLIC_ENABLE_DEMO_MODE=false`

### Billing provider setup

- choose the live provider path explicitly
- if using Stripe:
  - `BILLING_PROVIDER_DEFAULT=stripe` or set org `paymentProvider` to `stripe`
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - plan price IDs:
    - `STRIPE_PRICE_STARTER_MONTHLY`
    - `STRIPE_PRICE_STARTER_QUARTERLY`
    - `STRIPE_PRICE_STARTER_ANNUAL`
    - `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
    - `STRIPE_PRICE_PROFESSIONAL_QUARTERLY`
    - `STRIPE_PRICE_PROFESSIONAL_ANNUAL`
    - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
    - `STRIPE_PRICE_ENTERPRISE_QUARTERLY`
    - `STRIPE_PRICE_ENTERPRISE_ANNUAL`
- if using Paystack or Flutterwave:
  - credentials may be present, but checkout/webhook adapter work is still pending
  - do not mark payments live yet

## C. Human validation items

- production database is reachable
- pending Prisma migrations are applied
- `npx prisma generate` succeeds against the release build
- dependency audit has been reviewed
- fake-data review report-only run has been completed against a reachable staging or production clone
- founder/super-admin account is validated
- new org onboarding has been tested end to end
- invite acceptance has been tested
- fresh workspace starts blank without demo leakage
- portal access-code rate limiting has been tested
- shared-store rate limiting is active in production
- observability/alerting receives test events
- pricing page has been reviewed and does not imply live checkout unless billing is actually enabled
- admin billing page correctly reports provider readiness
- a backup has been completed before launch
- restore drill has been tested and recorded
- smoke tests in `docs/operations/production-smoke-tests.md` pass

## D. Launch blockers

- do not launch with in-memory rate limiting as the only production limiter
- do not launch with observability webhooks/Sentry unset if you expect incident visibility
- do not mark payments live unless:
  - checkout route is configured
  - webhook verification is configured
  - provider webhook endpoint is registered
  - subscription lifecycle smoke tests pass
- do not skip fake-data review on a reachable staging/prod clone
- do not skip the backup + restore drill

## Dependency risk acceptance

Current known unresolved advisories after safe upgrades:

- `next` moderate via bundled `postcss@8.4.31`
- `nodemailer` moderate on the `7.x` line used with current `next-auth`

Owner action before launch:

- either accept these moderate risks explicitly for this release
- or hold launch until upstream-safe dependency remediation is available and verified
