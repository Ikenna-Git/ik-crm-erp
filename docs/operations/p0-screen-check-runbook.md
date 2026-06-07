# P0 Screen Check Runbook

Date: 2026-06-07
Branch: `p0-full-platform-runtime-sweep`

## Purpose

Use this after a `main` redeploy to do the minimum live screen verification for the current P0 sweep.

## Rules

- record only what was actually observed
- refresh after every mutation that is supposed to persist
- if success disappears after refresh, mark the screen as failed
- if an environment-backed provider is missing, mark the screen as blocked, not passed
- if a feature says it is not implemented, that is acceptable only if no fake success occurred first

## Roles

- founder `SUPER_ADMIN`
- `ORG_OWNER`
- normal authenticated user
- one newly invited user from the current invite flow

## Screen Test Table

| Route | Role | Expected result | Actual result | Pass / Fail / Blocked | Evidence / Notes | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/login` | logged out | Login page loads cleanly |  |  |  |  |  |
| `/dashboard` | logged out | Redirected or blocked |  |  |  |  |  |
| `/admin` | logged out | Redirected or blocked |  |  |  |  |  |
| `/dashboard` | normal user | Correct workspace loads, no wrong-org flash |  |  |  |  |  |
| `/admin` | founder | Founder Desk and platform controls visible |  |  |  |  |  |
| `/admin` | org owner | Founder Desk hidden |  |  |  |  |  |
| `/admin/system` | org owner | Blocked / forbidden |  |  |  |  |  |
| `/api/admin/orgs` | org owner | Blocked / forbidden |  |  |  |  |  |
| `/api/admin/platform-status` | org owner | Blocked / forbidden |  |  |  |  |  |
| `/admin/users` | org owner | Same-org users only, founder row hidden |  |  |  |  |  |
| Invite flow from `/admin/users` or `/dashboard/settings` | founder / org owner | Invite created; link or email generated |  |  |  |  |  |
| Invite acceptance `/signup?...` | invited user | Lands in invite org only; role matches invite |  |  |  |  |  |
| `/dashboard/accounting` | accounting user | Page loads without runtime crash |  |  |  |  |  |
| `/dashboard/accounting` invoices | accounting user | Invoices list loads and stays scoped to own org |  |  |  |  |  |
| `/dashboard/accounting` expenses | accounting user | Expenses list loads and stays scoped to own org |  |  |  |  |  |
| `/dashboard/accounting` invoice approval | accounting user | Request approval once; second request blocked; refresh keeps pending status |  |  |  |  |  |
| `/dashboard/accounting` expense approval | accounting user | Request approval once; second request blocked; refresh keeps pending status |  |  |  |  |  |
| `/dashboard/operations` approvals | operations admin | Pending approvals show only own-org items |  |  |  |  |  |
| `/dashboard/operations` approvals approve | operations admin | Approve persists; refresh keeps approved state |  |  |  |  |  |
| `/dashboard/operations` approvals reject | operations admin | Reject persists; refresh keeps rejected state |  |  |  |  |  |
| `/dashboard/operations` integrations | operations admin | UI does not claim connected state unless provider/config is real |  |  |  |  |  |
| `/dashboard/operations` reports | operations admin | UI clearly says report saving is not persisted yet |  |  |  |  |  |
| `/dashboard/crm` contacts | CRM user | Create/edit/delete persists and refresh survives |  |  |  |  |  |
| `/dashboard/crm` companies | CRM user | Create/edit/delete persists and refresh survives |  |  |  |  |  |
| `/dashboard/crm` deals | CRM user | Create/edit/delete persists and refresh survives |  |  |  |  |  |
| `/dashboard/crm` follow-ups | CRM user | If DB/API unavailable, screen says automation unavailable; no simulated task creation |  |  |  |  |  |
| `/dashboard/tasks` or tasks surface | task user | Task mutations persist and remain scoped |  |  |  |  |  |
| `/dashboard/playbooks` | operations admin | Launch/pause/advance persists after refresh |  |  |  |  |  |
| `/dashboard/operations` workflows | operations admin | Update applies only to own-org workflow |  |  |  |  |  |
| `/dashboard/hr` payroll | HR user | Payroll records load; approval action is clearly not implemented |  |  |  |  |  |
| `/dashboard/inventory` purchase orders | inventory user | Orders load; approval action is clearly not implemented |  |  |  |  |  |
| `/dashboard/settings` profile | authenticated user | Profile save persists after refresh |  |  |  |  |  |
| `/dashboard/settings` workspace | admin | Workspace name persists after refresh |  |  |  |  |  |
| `/dashboard/settings` security | authenticated user | UI does not claim unsupported security toggles persisted |  |  |  |  |  |
| `/dashboard/gallery` upload | gallery user | Upload succeeds only if Cloudinary is configured; otherwise clear config error |  |  |  |  |  |
| Notifications UI | authenticated user | Notification create/read state persists through DB; no simulated success |  |  |  |  |  |
| Reports / exports | permitted user | Export succeeds only through real backend/provider path |  |  |  |  |  |
| `/dashboard/ai` | authenticated user | Missing AI config fails clearly or uses explicit fallback messaging |  |  |  |  |  |
| Billing / pricing / checkout path | billing-eligible role | Missing billing config fails closed with no fake payment success |  |  |  |  |  |

## Failure Capture

If any screen fails, capture:

- route
- role used
- expected vs actual
- first browser console error
- failed network request and status code
- whether refresh reproduces it
- relevant Render log line if available

## Exit Criteria

The live pass is complete only when:

- no core business workflow depends on browser-only state
- any non-persisted feature says so clearly before the user trusts it
- founder and org boundaries remain correct after refresh
- approval transitions survive refresh and a second page load
