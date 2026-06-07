# P0 Go-Live Evidence Pack

Date: 2026-06-07  
Branch: `p0-automated-smoke-validation`

## Purpose

This file is the deployment gate for P0. A release is not go-live ready until the critical evidence rows below have been filled with real results.

## Evidence Rules

- record only observed results
- blocked is not pass
- screenshots or log references should be linked in the notes column
- if provider config is missing, mark blocked or fail clearly
- do not claim production readiness without completed evidence

## Go-Live Evidence Table

| Test area | Test item | Role | Route / API | Expected result | Actual result | Pass / Fail / Blocked | Evidence link / screenshot note | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth and access | Logged-out dashboard blocked | logged out | `/dashboard` | Redirected or blocked |  |  |  |  |  |
| Auth and access | Logged-out admin blocked | logged out | `/admin` | Redirected or blocked |  |  |  |  |  |
| Auth and access | Founder login works | founder | `/login` | Founder lands in correct workspace/admin scope |  |  |  |  |  |
| Auth and access | Org owner login works | org owner | `/login` | Org owner lands in correct workspace only |  |  |  |  |  |
| Auth and access | Normal user login works | normal user | `/login` | User lands in correct workspace only |  |  |  |  |  |
| Admin and org boundary | Founder Desk visible to founder | founder | `/admin` | Founder-only navigation visible |  |  |  |  |  |
| Admin and org boundary | Founder Desk hidden from org owner | org owner | `/admin` | Founder-only navigation hidden |  |  |  |  |  |
| Admin and org boundary | Org owner blocked from system page | org owner | `/admin/system` | Forbidden / redirect |  |  |  |  |  |
| Admin and org boundary | Org owner blocked from org API | org owner | `/api/admin/orgs` | `401/403` or equivalent block |  |  |  |  |  |
| Admin and org boundary | Org owner blocked from platform status API | org owner | `/api/admin/platform-status` | `401/403` or equivalent block |  |  |  |  |  |
| Admin and org boundary | Org owner team list is same-org only | org owner | `/admin/users` | Founder/super-admin not visible; same-org only |  |  |  |  |  |
| Invite flow | Founder invites org owner | founder | `/admin/users` or `/dashboard/settings` | Invite created and link/email generated |  |  |  |  |  |
| Invite flow | Invitee lands in invite org | invited user | invite link + `/signup` | Correct org only |  |  |  |  |  |
| Invite flow | Invitee receives intended role only | invited user | post-login | Role matches invite |  |  |  |  |  |
| Invite flow | Invite cannot create SUPER_ADMIN | invited user | invite acceptance | SUPER_ADMIN not assigned |  |  |  |  |  |
| Accounting | Invoice approval requested once | accounting user | `/dashboard/accounting` | Request works once |  |  |  |  |  |
| Accounting | Duplicate invoice approval blocked | accounting user | `/dashboard/accounting` | Duplicate blocked while pending |  |  |  |  |  |
| Accounting | Invoice approval appears in Operations | operations admin | `/dashboard/operations` | Pending approval visible after request |  |  |  |  |  |
| Accounting | Invoice approve persists | operations admin | `/dashboard/operations` | Approved after refresh |  |  |  |  |  |
| Accounting | Expense lifecycle persists | accounting / operations admin | `/dashboard/accounting`, `/dashboard/operations` | Request/approve/reject survive refresh |  |  |  |  |  |
| Accounting | No cross-org approvals | org owner / operations admin | approvals surfaces | Only own-org approvals visible |  |  |  |  |  |
| CRM | Contact create/edit/delete persists | CRM user | `/dashboard/crm` | Changes survive refresh |  |  |  |  |  |
| CRM | Company create/edit/delete persists | CRM user | `/dashboard/crm` | Changes survive refresh |  |  |  |  |  |
| CRM | Deal create/edit/delete persists | CRM user | `/dashboard/crm` | Changes survive refresh |  |  |  |  |  |
| Operations | Approvals list loads | operations admin | `/dashboard/operations` | List loads without error |  |  |  |  |  |
| Operations | Report/integration UI is honest | operations admin | `/dashboard/operations` | No fake persistence claims |  |  |  |  |  |
| Operations | Workflow update remains org-scoped | operations admin | `/dashboard/operations` | Only own-org workflow changes |  |  |  |  |  |
| Settings | Profile save persists | authenticated user | `/dashboard/settings` | Saved data survives refresh |  |  |  |  |  |
| Settings | Workspace name save persists | admin | `/dashboard/settings` | Name survives refresh |  |  |  |  |  |
| Settings | Security toggle UI stays honest | authenticated user | `/dashboard/settings` | No fake saved state for unsupported toggles |  |  |  |  |  |
| Uploads | Cloudinary configured upload succeeds | gallery user | `/dashboard/gallery` | Upload completes successfully |  |  |  |  |  |
| Uploads | Cloudinary missing shows config error | gallery user | `/dashboard/gallery` | Clear error, no fake upload success |  |  |  |  |  |
| Notifications | Notifications persist | authenticated user | notifications UI / API | Create/read state survives refresh |  |  |  |  |  |
| HR and inventory | Payroll approvals clearly unavailable | HR user | `/dashboard/hr` | Clearly marked unavailable |  |  |  |  |  |
| HR and inventory | Purchase approvals clearly unavailable | inventory user | `/dashboard/inventory` | Clearly marked unavailable |  |  |  |  |  |
| Billing | Missing Stripe fails safely | billing-eligible role | pricing/checkout path | Fail closed, no fake payment success |  |  |  |  |  |
| Billing | Stripe test validation documented | billing-eligible role | billing docs + staging | Steps complete before live payments |  |  |  |  |  |
| Environment | Core auth/database envs present | deploy admin | hosting env | Present / verified |  |  |  |  |  |
| Environment | Upstash/SMTP/Cloudinary/observability/Stripe | deploy admin | hosting env | Present or marked blocked |  |  |  |  |  |

## Go-Live Decision

Mark one only after the table above is filled:

- Merge recommendation: `YES / NO`
- Deploy recommendation: `YES / NO`
- Reason:
