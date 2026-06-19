# P0 Live Validation Log

Date: 2026-06-19
Branch: `p0-customer-demo-readiness-launch-automation`

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
