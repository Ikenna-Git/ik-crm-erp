# Civis Observability Production Setup

Updated: 2026-05-07

## Required env vars

- `OBSERVABILITY_WEBHOOK_URL`
- `SECURITY_EVENTS_WEBHOOK_URL`
- `ERROR_ALERT_WEBHOOK_URL`
- optional `SENTRY_DSN`

## What the platform logs today

The current server-side foundation logs structured events for:

- auth failures
- admin access denials
- module access denials
- billing checkout requests
- billing webhook failures and rejections
- export actions
- upload failures
- webhook edits
- rollback actions
- billing feature denials
- other routed server errors captured by the hardening helpers

## What must never be logged

Never log:

- passwords
- session secrets
- auth tokens
- refresh tokens
- API keys
- webhook signing secrets
- raw card/payment credentials
- full sensitive request payloads

## Setup steps

1. Configure the webhook endpoints or Sentry DSN in the target environment
2. Redeploy the application
3. Trigger test events from non-production where possible
4. Confirm the alerts arrive in the expected sink

## How to test auth denial logging

1. Call a protected route without valid auth
2. Confirm:
   - the request is denied
   - a security/observability event is emitted

## How to test admin denial logging

1. Sign in as a non-admin user
2. Attempt to access `/admin` or `/api/admin/users`
3. Confirm:
   - access is denied
   - the denial is logged

## How to test billing webhook failure logging

1. POST to `/api/billing/webhook` with a missing or invalid signature
2. Confirm:
   - the webhook is rejected
   - a billing/security event is logged
   - no secret or raw signature contents are exposed in logs

## How to test rollback/admin action logging

1. Execute an allowed rollback or admin settings change in a non-production environment
2. Confirm:
   - the action completes or is denied correctly
   - audit logging is written
   - observability captures the action outcome

## Production rule

Do not rely on local console logging as your only production incident signal. If webhook/Sentry-style sinks are unset, Civis is operating with reduced operational visibility.
