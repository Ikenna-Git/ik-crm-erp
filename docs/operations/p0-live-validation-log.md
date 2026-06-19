# P0 Live Validation Log

Date: 2026-06-19
Branch: `p0-fix-privacy-pin-and-launch-readiness-sweep`

## New Launch-Window Finding
- Live manual validation found a real browser blocker:
  - HR privacy PIN input could not be typed
  - Accounting privacy PIN input could not be typed
- Root cause:
  - the client pages were gating PIN input and unlocked UI from client-side role shape instead of the server `/api/privacy-lock` `canUnlock` result
- Fix made on this branch:
  - HR and Accounting pages now store `privacyCanUnlock` and `privacyMessage` from the server
  - the unlock panel now explains loading, unauthorized, and missing-config states clearly
  - locked detail dialogs open in protected mode without exposing sensitive fields
  - readiness/setup surfaces were updated to keep privacy items limited until fresh live evidence is captured

## Recorded Evidence Already On File
- Smoke test against `https://ik-crm-erp.onrender.com`
  - command: `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke`
  - prior recorded result: `25 checks`, `0 fail`
  - logged-out `/dashboard` blocked with `307 -> /login`
  - logged-out `/admin` blocked with `307 -> /login`
  - logged-out `/api/admin/orgs` blocked with `401`
  - logged-out `/api/admin/platform-status` blocked with `401`

## New Evidence To Capture In This Launch Window

| Area | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/launch-readiness` | Founder | Loads and shows safe provider/module/evidence sections |  |  |  |  |  |
| `/dashboard/setup` | Org owner or admin | Loads and shows honest setup statuses |  |  |  |  |  |
| `/dashboard/hr` PIN input | Authorized HR role | PIN field enabled when server says unlock is allowed |  |  |  |  |  |
| `/dashboard/accounting` PIN input | Authorized finance role | PIN field enabled when server says unlock is allowed |  |  |  |  |  |
| Invite flow | Founder + invited user | Invited user lands in correct org and role only |  |  |  |  |  |
| CRM CRUD | Workspace user | Create/edit/refresh persists contact/company/deal |  |  |  |  |  |
| Accounting approvals | Finance / ops | Request + approve/reject persists after refresh |  |  |  |  |  |
| HR privacy PIN | Authorized HR role | Wrong PIN blocked, correct PIN unlocks, re-lock hides details |  |  |  |  |  |
| Accounting privacy PIN | Authorized finance role | Wrong PIN blocked, correct PIN unlocks, re-lock hides details |  |  |  |  |  |
| Civis Guide deterministic commands | Authenticated user | Navigation and guidance commands behave honestly |  |  |  |  |  |
| Provider diagnostics | Founder | Configured/missing/partial only, no secret leak |  |  |  |  |  |
| Backup evidence | Founder | Latest backup proof is attached |  |  |  |  |  |
| Restore drill evidence | Founder | Restore drill proof is attached |  |  |  |  |  |
| Fake-data review | Founder | Sample/demo data is reviewed and labeled honestly |  |  |  |  |  |
