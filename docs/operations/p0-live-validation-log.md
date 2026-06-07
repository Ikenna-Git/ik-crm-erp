# P0 Live Validation Log

Date: 2026-06-07
Branch: `p0-full-launch-readiness-audit`

Use this file during each Render validation pass.

## Smoke Runner Notes

- network/connectivity failures from `npm run p0:smoke` should be recorded as `Blocked`, not `Fail`
- use debug mode when needed:
  - `BASE_URL=https://your-render-url P0_SMOKE_DEBUG=1 npm run p0:smoke`
- increase timeout/retries for cold starts if needed:
  - `P0_SMOKE_TIMEOUT_MS`
  - `P0_SMOKE_RETRIES`
  - `P0_SMOKE_RETRY_DELAY_MS`

## Route Guard Fix History

- logged-out `/dashboard` previously returned `200`
- logged-out `/admin` previously returned `200`
- root cause: page protection lived in client-only layouts and redirected after render
- fix applied on `main`: server-side guards in dashboard and admin layouts
- live smoke evidence below confirms that the fix is deployed and active

## Launch Audit Addendum

- this branch also carries the verified prototype/debug UI sweep
- public pricing copy now avoids implying live self-serve billing
- portal approvals now fail closed once a client update is already approved or rejected
- these items still require live browser verification after redeploy

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
| Admin and org boundary | Org owner blocked from Founder Desk |  | `/admin`, `/admin/system` | Hidden/blocked |  |  | Manual/browser role validation still required |  |  |
| Invite flow | Invited user lands in invite org only |  | invite link, `/signup` | Correct org only |  |  | Manual/browser validation still required |  |  |
| Accounting | Invoice approval lifecycle |  | accounting + operations pages | Persisted request/decision after refresh |  |  | Manual/browser validation still required |  |  |
| CRM | Contact/company/deal persistence |  | `/dashboard/crm` | CRUD survives refresh |  |  | Manual/browser validation still required |  |  |
| Operations | Approvals/workflows scope |  | `/dashboard/operations` | Org-scoped, honest UI |  |  | Manual/browser validation still required |  |  |
| Settings | Profile/workspace save honesty |  | `/dashboard/settings` | Persisted only where supported |  |  | Manual/browser validation still required |  |  |
| Uploads | Cloudinary behavior |  | `/dashboard/gallery` | Real upload or clear config error |  |  | Manual/provider validation still required |  |  |
| Notifications | Persistence |  | notifications UI / API | Survives refresh |  |  | Manual/write validation still required |  |  |
| Billing | Missing or test Stripe behavior |  | pricing/checkout | Safe failure or validated test flow |  |  | Manual/provider validation still required |  |  |
| UI trust | No native browser dialogs in launch flows |  | dashboard/admin/public pages | No `alert` / `confirm` / `prompt` for real product actions |  |  | Manual/browser validation still required |  |  |
| UI trust | No raw JSON detail popups |  | CRM/accounting/HR/inventory/projects | Details render in-app dialogs, not JSON alerts |  |  | Manual/browser validation still required |  |  |
| Billing | Pricing page is honest about non-live self-serve checkout | logged out | `/pricing` | Sign-up CTA only; no claim that public checkout is already live |  |  | Manual/browser validation still required |  |  |
| Portal | Finalized update cannot be re-approved/re-rejected | portal user | `/portal/[code]` + `/api/portal/[code]/approvals` | Second decision blocked |  |  | Manual/browser validation still required |  |  |

## Outcome

| Decision | Value |
| --- | --- |
| Safe to merge | No decision yet |
| Safe to deploy | No decision yet |
| Remaining blockers | 15 smoke checks remain blocked by design: missing role cookies, invite/manual browser validation, approval lifecycle writes, CRM CRUD writes, upload/provider validation, notification write validation, and remote env verification |
