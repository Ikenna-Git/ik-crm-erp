# Civis Production Deployment Checklist

Updated: 2026-05-07

Use this checklist before deploying or promoting a release to the live environment.

## Environment

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
- payment provider envs are either configured intentionally or left blank with billing still marked non-live
- local-dev fallback flags are explicitly set to `false`

## Database / build

- production database is reachable
- pending Prisma migrations are applied
- `npx prisma generate` succeeds
- production build passes
- dependency audit has been reviewed
- critical/high dependency vulnerabilities are resolved or explicitly risk-accepted

## Security / runtime

- shared-store rate limiting is active in production
- portal access-code rate limiting has been tested
- observability/alerting receives test events
- logged-out users cannot access dashboard or admin routes
- non-admins cannot access admin routes or admin APIs
- rollback/admin destructive routes are tested and audited
- founder/super-admin account is validated
- normal admin cannot grant `SUPER_ADMIN`
- no dev/demo fallback flags are enabled

## Data / onboarding

- fake-data review report-only run has been completed against a reachable staging or production clone
- new org onboarding has been tested end to end
- invite acceptance has been tested
- fresh workspace starts blank without demo leakage

## Recovery

- a backup has been completed before launch
- restore drill has been tested and recorded
- RPO/RTO assumptions are understood

## Billing honesty

- pricing page is reviewed and does not imply live checkout if checkout is not implemented
- admin billing routes are protected
- payment status is clearly marked non-live unless checkout + webhook + subscription lifecycle exist
- plan gating status has been reviewed
