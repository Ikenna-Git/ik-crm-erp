# P0 Live Validation Log

Date: 2026-06-07  
Branch: `p0-automated-smoke-validation`

Use this file during each Render validation pass.

## Smoke Runner Notes

- network/connectivity failures from `npm run p0:smoke` should be recorded as `Blocked`, not `Fail`
- use debug mode when needed:
  - `BASE_URL=https://your-render-url P0_SMOKE_DEBUG=1 npm run p0:smoke`
- increase timeout/retries for cold starts if needed:
  - `P0_SMOKE_TIMEOUT_MS`
  - `P0_SMOKE_RETRIES`
  - `P0_SMOKE_RETRY_DELAY_MS`

## Session Header

| Item | Value |
| --- | --- |
| Render URL | `https://ik-crm-erp.onrender.com` |
| Branch / commit | `main` after protected page route guard fix merge/deploy |
| Tester | Live smoke runner |
| Date | 2026-06-07 |
| Build version shown in Render | Protected page route guard fix live |
| Environment notes | `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke` returned `25 checks, 0 fail, 15 blocked` |

## Validation Log

| Test area | Test item | Role | Route / API | Expected result | Actual result | Pass / Fail / Blocked | Evidence / Notes | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth and access | Logged-out dashboard blocked | logged out | `/dashboard` | Redirected or blocked | `307` redirect to `/login` | Pass | Protected page route guard fix confirmed live | Live smoke runner | 2026-06-07 |
| Auth and access | Logged-out admin blocked | logged out | `/admin` | Redirected or blocked | `307` redirect to `/login` | Pass | Protected page route guard fix confirmed live | Live smoke runner | 2026-06-07 |
| Auth and access | Public homepage reachable | logged out | `/` | `200-399` | `200` | Pass | Public route remained accessible | Live smoke runner | 2026-06-07 |
| Auth and access | Login page reachable | logged out | `/login` | `200-399` | `200` | Pass | Public route remained accessible | Live smoke runner | 2026-06-07 |
| Billing | Pricing page reachable | logged out | `/pricing` | `200-399` | `200` | Pass | Public route remained accessible | Live smoke runner | 2026-06-07 |
| Admin and org boundary | Logged-out org API blocked | logged out | `/api/admin/orgs` | `401/403` | `401` | Pass | API auth behavior unchanged | Live smoke runner | 2026-06-07 |
| Admin and org boundary | Logged-out platform status API blocked | logged out | `/api/admin/platform-status` | `401/403` | `401` | Pass | API auth behavior unchanged | Live smoke runner | 2026-06-07 |
| Admin and org boundary | Org owner blocked from Founder Desk |  | `/admin`, `/admin/system` | Hidden/blocked |  |  |  |  |  |
| Invite flow | Invited user lands in invite org only |  | invite link, `/signup` | Correct org only |  |  |  |  |  |
| Accounting | Invoice approval lifecycle |  | accounting + operations pages | Persisted request/decision after refresh |  |  |  |  |  |
| CRM | Contact/company/deal persistence |  | `/dashboard/crm` | CRUD survives refresh |  |  |  |  |  |
| Operations | Approvals/workflows scope |  | `/dashboard/operations` | Org-scoped, honest UI |  |  |  |  |  |
| Settings | Profile/workspace save honesty |  | `/dashboard/settings` | Persisted only where supported |  |  |  |  |  |
| Uploads | Cloudinary behavior |  | `/dashboard/gallery` | Real upload or clear config error |  |  |  |  |  |
| Notifications | Persistence |  | notifications UI / API | Survives refresh |  |  |  |  |  |
| Billing | Missing or test Stripe behavior |  | pricing/checkout | Safe failure or validated test flow |  |  |  |  |  |

## Outcome

| Decision | Value |
| --- | --- |
| Safe to merge | No decision yet |
| Safe to deploy | No decision yet |
| Remaining blockers | 15 smoke checks remain blocked by design: missing role cookies, invite/manual browser validation, approval lifecycle writes, CRM CRUD writes, upload/provider validation, notification write validation, and remote env verification |
