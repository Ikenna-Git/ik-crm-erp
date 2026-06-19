# P0 Live Validation Log

Date: 2026-06-19
Branch: `p0-permanent-admin-centre-privacy-pins-and-motion-performance`

## New Launch-Window Finding
- Permanent product correction:
  - env-only `HR_PRIVACY_PIN` and `ACCOUNTING_PRIVACY_PIN` were rejected as the customer path
  - organisation admins must now manage HR and Accounting privacy PINs inside Civis
- Fix made on this branch:
  - added org-scoped `OrgPrivacyLockSetting`
  - PINs are hashed and never returned to the browser
  - unlock cookies are signed and versioned per org/module
  - PIN rotation and force-lock invalidate existing unlock sessions automatically
  - `/dashboard/admin` is now a real Workspace Admin Center
  - HR and Accounting missing-config copy now points users to Workspace Admin Center → Privacy Locks
  - landing system cursor is now default and custom cursor is opt-in only

## Recorded Evidence Already On File
- Smoke test against `https://ik-crm-erp.onrender.com`
  - command: `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke`
  - current recorded result: `32 checks`, `0 fail`, `17 blocked`, `3 warning`
  - logged-out `/dashboard` blocked with `307 -> /login`
  - logged-out `/admin` blocked with `307 -> /login`
  - logged-out `/api/admin/orgs` blocked with `401`
  - logged-out `/api/admin/platform-status` blocked with `401`
  - warm-up reached the live app with `200`

## New Evidence To Capture In This Launch Window

| Area | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/launch-readiness` | Founder | Loads and shows safe provider/module/evidence sections |  |  |  |  |  |
| `/dashboard/setup` | Org owner or admin | Loads and shows honest setup statuses |  |  |  |  |  |
| `/dashboard/admin#privacy-locks` | Org admin | HR and Accounting PINs can be set or rotated without deployment access |  |  |  |  |  |
| `/dashboard/hr` PIN input | Authorized HR role | PIN field enabled when server says unlock is allowed; missing setup points to Privacy Locks |  |  |  |  |  |
| `/dashboard/accounting` PIN input | Authorized finance role | PIN field enabled when server says unlock is allowed; missing setup points to Privacy Locks |  |  |  |  |  |
| Invite flow | Founder + invited user | Invited user lands in correct org and role only |  |  |  |  |  |
| CRM CRUD | Workspace user | Create/edit/refresh persists contact/company/deal |  |  |  |  |  |
| Accounting approvals | Finance / ops | Request + approve/reject persists after refresh |  |  |  |  |  |
| HR privacy PIN | Authorized HR role | Wrong PIN blocked, correct PIN unlocks, re-lock hides details |  |  |  |  |  |
| Accounting privacy PIN | Authorized finance role | Wrong PIN blocked, correct PIN unlocks, re-lock hides details |  |  |  |  |  |
| Privacy PIN rotation | Org admin + prior unlocked user | Old unlock session is invalid after rotation or force-lock |  |  |  |  |  |
| Landing performance | Public | System cursor default, custom cursor opt-in, no lag/hydration issues |  |  |  |  |  |
| Civis Guide deterministic commands | Authenticated user | Navigation and guidance commands behave honestly |  |  |  |  |  |
| Provider diagnostics | Founder | Configured/missing/partial only, no secret leak |  |  |  |  |  |
| Backup evidence | Founder | Latest backup proof is attached |  |  |  |  |  |
| Restore drill evidence | Founder | Restore drill proof is attached |  |  |  |  |  |
| Fake-data review | Founder | Sample/demo data is reviewed and labeled honestly |  |  |  |  |  |
