# Civis Production Smoke Tests

Updated: 2026-05-07

Run these tests after deployment and before opening the platform broadly.

## Access control

- logged-out user cannot access `/dashboard`
- logged-out user cannot access `/admin`
- logged-out user receives `401` from protected APIs
- non-admin cannot access admin UI by direct URL
- non-admin cannot call admin APIs
- normal admin cannot grant `SUPER_ADMIN`
- authenticated user without workspace membership lands on `/workspace-required`

## Portal / rate limiting

- public portal code route works only with a valid code
- repeated portal code hits trigger rate limiting
- repeated portal approval hits trigger rate limiting

## Demo leakage

- new workspace loads without seeded demo business data
- `/dashboard/demo` is not exposed in production mode
- AI responses do not pretend local demo data is real production data when DB is unavailable

## Billing / pricing honesty

- `/admin/billing` is protected
- public pricing page clearly behaves as marketing-only if checkout is not implemented
- paid-only or plan-gated features fail safely for suspended/expired/inactive billing states

## Sensitive routes

- upload route is rate-limited and rejects unauthenticated access
- export route is rate-limited and rejects unauthenticated access
- AI route is rate-limited and rejects unauthenticated access
- webhook management is protected and audited
- rollback routes are protected and audited
- audit access is protected

## Logging / errors

- auth failure creates a server-side observability event
- admin denial creates a security event
- export action creates an audit entry
- rollback action creates an audit entry
- no console/server errors appear during main flows
