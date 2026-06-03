# Civis Go-Live Decision

Updated: 2026-05-07

## Current branch

- `p0-final-payment-gating-go-live-readiness`

## Current commit

- validated baseline: `f95fa39`

## Build status

- passing locally on this branch

## Lint status

- passing locally on this branch

## Audit status

- no critical advisories
- no high advisories
- 3 moderate advisories remain:
  - `next` via bundled `postcss`
  - nested `postcss` under `next`
  - `nodemailer`

## Payment status

- pricing page: public marketing preview
- billing metadata/settings: implemented
- checkout route: implemented
- webhook route: implemented
- verified Stripe lifecycle foundation: implemented
- live payments: NOT ENABLED

## A. Code-complete today

- auth and admin hardening from the prior passes
- billing status, checkout, and webhook routes
- verified Stripe billing lifecycle foundation in code
- server-side feature gating for the main paid/high-value routes
- seat-limit enforcement on new invites
- shared-store limiter integration path in code
- structured observability/security logging hooks in code

## B. Requires environment configuration

- production database URL
- auth/session secrets
- shared-store rate limiting env vars
- observability webhook and optional Sentry env vars
- SMTP
- Cloudinary
- AI provider keys if AI remains enabled
- billing provider env vars and Stripe price IDs

## C. Requires external dashboard/provider setup

- Stripe test products and prices
- Stripe webhook endpoint registration
- Upstash/Redis provisioning
- observability destination setup outside the app

## D. Requires human validation

- fake-data review against a reachable staging/prod clone
- backup execution evidence
- restore drill evidence
- Stripe staging checkout/webhook validation
- production smoke-test sign-off

## E. Still blocks merge/deployment

- no live provider validation evidence
- no shared-store live evidence
- no observability live evidence
- no fake-data review evidence
- no restore-drill evidence
- remaining moderate advisories need explicit risk acceptance or later remediation

## Rate limiting status

- shared-store code path: implemented
- production shared-store config: NOT VERIFIED

## Observability status

- code foundation: implemented
- live webhook/Sentry config: NOT VERIFIED

## Fake-data review status

- script exists
- safer report-only workflow exists
- reachable staging/prod-clone validation: NOT PERFORMED

## Backup/restore status

- documentation exists
- restore-drill evidence: NOT PERFORMED

## Merge decision

- `NO`

Reason:

- this branch still depends on external environment and human validation steps that do not yet have evidence
- billing is not live
- fake-data review evidence does not exist
- restore-drill evidence does not exist

## Deploy decision

- `NO`

Reason:

- Stripe/env/dashboard setup is incomplete
- shared-store rate limiting is not evidenced as live-configured
- observability is not evidenced as live-configured
- fake-data review against a reachable DB has not been completed
- restore drill has not been completed

## Exact blockers

- configure billing provider env vars and Stripe dashboard webhook
- complete Stripe staging validation
- configure Upstash/Redis production rate limiting
- configure observability webhook/Sentry sinks
- run fake-data review against staging or a production clone
- perform backup and restore drill
- explicitly risk-accept or later remediate the remaining moderate advisories

## Owner/admin actions required

- populate `.env.production.example` values in staging/production
- run the Stripe staging checklist in `docs/billing/stripe-staging-validation.md`
- run the rate-limit setup checklist in `docs/operations/rate-limit-production-setup.md`
- run the observability setup checklist in `docs/operations/observability-production-setup.md`
- run fake-data report-only review and export the report
- record backup evidence and restore-drill evidence
- run the production smoke tests and sign off
