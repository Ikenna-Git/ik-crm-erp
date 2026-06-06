# P0 Screen Check Runbook

Date: 2026-06-06  
Branch: `p0-core-runtime-bug-sweep`

## Purpose

Use this runbook to do a quick live screen-by-screen check after a `main` redeploy. It focuses on the flows most likely to regress when browser storage, org scoping, approvals, or admin boundaries change.

## Rules

- record only what was actually observed
- refresh after any mutation
- if a page shows success but refresh loses the state, mark it as failed
- if a page depends on missing environment config, mark it as blocked, not passed

## Screen Checklist

| Screen | What to do | Expected result | Evidence / Notes | Pass / Fail / Blocked |
| --- | --- | --- | --- | --- |
| `/login` | Sign in as normal user | Login succeeds, no raw JSON/auth crash |  |  |
| `/dashboard` | Load after login | Correct workspace loads, no wrong-org flash |  |  |
| `/dashboard/accounting` | Open page and refresh | No full-page crash; invoices, expenses, widgets load or safe fallback |  |  |
| `/dashboard/accounting` invoices | Request invoice approval | Approval persists and appears in Operations after refresh |  |  |
| `/dashboard/accounting` expenses | Request expense approval | Approval persists and appears in Operations after refresh |  |  |
| `/dashboard/operations` approvals | Open approvals tab | Pending approvals list is org-scoped and persisted |  |  |
| `/dashboard/operations` approvals | Approve or reject an item | Decision persists after refresh; source record reflects new state |  |  |
| `/dashboard/operations` integrations | Open integrations tab | UI does not imply fake saved connection state |  |  |
| `/dashboard/operations` reports | Save custom report if UI offers it | UI clearly says this is not persisted yet unless a backend exists |  |  |
| `/dashboard/playbooks` | Launch a playbook | Run appears from API-backed response and remains after refresh |  |  |
| `/dashboard/playbooks` | Pause or advance a run | Status/progress remains correct after refresh |  |  |
| `/dashboard/settings` profile | Save profile | Profile persists after refresh |  |  |
| `/dashboard/settings` workspace | Save workspace name | Name persists after refresh |  |  |
| `/dashboard/settings` security | Toggle controls | UI does not claim persistence if backend save is missing |  |  |
| `/admin` as founder | Load admin root | Founder-only navigation is visible |  |  |
| `/admin` as org owner | Load admin root | Founder-only navigation is hidden |  |  |
| `/admin/system` as org owner | Open directly | Blocked/forbidden |  |  |
| `/admin/users` as org owner | Open user list | Same-org users only; founder not shown |  |  |
| `/api/admin/orgs` as org owner | Request directly | Blocked/forbidden |  |  |
| `/api/admin/platform-status` as org owner | Request directly | Blocked/forbidden |  |  |
| Invite flow | Create invite, accept invite, sign in | User lands in invite org only; role is intended role only |  |  |
| SMTP-backed action | Send invite or other mail action | Success if configured; clear config error if not |  |  |
| Cloudinary-backed upload | Upload a file | Success if configured; clear config error if not |  |  |
| AI screen | Open or send prompt | Clear disabled/missing-config behavior if provider unavailable |  |  |
| Billing/pricing | Open checkout path | Fail closed if billing config missing; no fake live checkout |  |  |

## Console / Network Capture

If any screen fails, capture:

- first browser console error
- failed network request and status code
- route and actor role
- whether refresh reproduces it
- relevant Render log line if available

## Roles To Use

- founder `SUPER_ADMIN`
- org owner
- normal user
- one invited user created through the current invite flow

## Exit Criteria

This screen check pass is complete only when:

- no core workflow depends on browser-only state
- any intentionally non-persisted screen says so clearly
- org and founder boundaries stay correct after refresh
- approvals survive refresh and a new page load
