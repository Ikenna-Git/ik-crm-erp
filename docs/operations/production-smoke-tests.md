# Civis Production Smoke Tests

Updated: 2026-05-07

Run these checks after deployment and before opening Civis broadly.

## 1. Access control

- logged-out user opens `/dashboard`
  - pass: redirected to `/login` with callback URL
- logged-out user opens `/admin`
  - pass: redirected to `/login`
- logged-out user calls a protected API such as `/api/app/bootstrap`
  - pass: receives `401`
- non-admin opens `/admin`
  - pass: redirected away from admin area
- non-admin calls `/api/admin/users`
  - pass: receives `403`
- normal admin attempts to assign `SUPER_ADMIN`
  - pass: request is rejected server-side
- authenticated user without workspace membership opens a protected page
  - pass: lands on `/workspace-required`

## 2. Billing routes

- authenticated org user calls `GET /api/billing/status`
  - pass: receives current billing metadata and provider/runtime summary
- owner/admin calls `POST /api/billing/checkout` without provider config
  - pass: receives clear `503` or configuration error, not a fake success
- owner/admin calls `POST /api/billing/checkout` with Stripe test config present
  - pass: receives redirect URL and session ID
- provider calls `POST /api/billing/webhook` without signature
  - pass: rejected
- provider calls `POST /api/billing/webhook` with invalid signature
  - pass: rejected

## 3. Billing gates and seat limits

- workspace with expired trial / past due / canceled billing tries a gated feature such as:
  - `/api/reports/export`
  - `/api/uploads/cloudinary`
  - `/api/webhooks`
  - `/api/playbooks`
  - `/api/ops/workflows`
  - pass: request is rejected server-side
- workspace with active billing uses the same gated feature
  - pass: request reaches normal validation/business logic
- org at seat limit attempts a new invite
  - pass: receives clear seat-limit error and the attempt is logged

## 4. Rate limiting

- repeated portal code hits on `/api/portal/[code]`
  - pass: rate limit triggers
- repeated portal approval hits on `/api/portal/[code]/approvals`
  - pass: rate limit triggers
- repeated calls to:
  - `/api/billing/checkout`
  - `/api/billing/webhook`
  - `/api/reports/export`
  - `/api/uploads/cloudinary`
  - `/api/ai/chat`
  - pass: route-level limiter triggers or returns config error if shared store is missing in production

## 5. Demo/fake-data leakage

- new workspace loads without seeded demo business data
  - pass: CRM, HR, Projects, Inventory, Docs, Portal, Gallery start blank
- `/dashboard/demo` in production
  - pass: not exposed
- production AI fallback path
  - pass: does not present fake business records as real production data

## 6. Billing/pricing honesty

- public pricing page
  - pass: still reads as marketing-only unless live provider configuration is actually active
- `/admin/billing`
  - pass: protected, shows provider readiness, missing config, and current billing state honestly
- no UI should show “payment successful” unless webhook/provider confirmation actually happened
  - pass: verified

## 7. Audit and observability

- auth failure
  - pass: security/observability event logged
- admin denial
  - pass: security event logged
- billing checkout request
  - pass: audit entry logged
- billing webhook lifecycle event
  - pass: audit entry logged
- export action
  - pass: audit entry logged
- rollback action
  - pass: audit entry logged

## 8. Clean runtime

- no browser console crashes on main flows
- no unhandled server exceptions on main flows
- no dev/demo flags are enabled in production
