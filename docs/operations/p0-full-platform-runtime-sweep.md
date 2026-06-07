# P0 Full Platform Runtime Sweep

Date: 2026-06-07  
Branch: `p0-full-platform-runtime-sweep`

## Scope

This sweep covers live-critical runtime behavior only:

- persistence must be API/database/server-backed for real business workflows
- missing provider config must fail clearly
- org and role boundaries must stay server-enforced
- non-persisted features must say so explicitly

## Platform Inventory

| Area | Route / Page | Main API routes | Expected live behaviour | Persistence source | Org scope | Role / access | Current status | Bug found | Fix made | Evidence / notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard / Home | `/dashboard` | `/api/notifications`, `/api/search`, module APIs | Loads the signed-in workspace only | DB + session | Own org only | Authenticated user | Needs live validation | No new code bug confirmed in this pass | None | Recheck wrong-org flash after redeploy |
| Admin / Users | `/admin/users` | `/api/admin/users` | Same-org team list only | DB | Same org only | Founder, org owner, admin | Needs live validation | Covered by prior P0 branch work | No new change here | Recheck founder user is hidden from org owner |
| Admin / Orgs / Workspaces | `/admin`, `/admin/system` | `/api/admin/orgs`, `/api/admin/platform-status`, `/api/admin/workspace` | Founder-only platform views; workspace settings scoped | DB | Founder-only for platform, workspace-scoped otherwise | Founder for platform controls | Needs live validation | Covered by prior P0 branch work | No new change here | Must still be rechecked after redeploy |
| Invite / Onboarding | `/signup`, `/dashboard/settings`, `/admin/users` | `/api/auth/signup`, `/api/admin/users` | Invite attaches user to invite org and intended role only | DB | Invite org only | Founder/org owner/admin based on route | Needs live validation | Covered by prior P0 branch work | No new change here | Validate with fresh invite after redeploy |
| Auth / Login / Logout | `/login`, `/signup` | `/api/auth/login/check`, NextAuth routes | Auth works without JSON/runtime crash; no default-org leakage | DB + session | Own org only | Anonymous/authenticated as appropriate | Needs live validation | Prior auth-page crash already fixed on earlier branches | No new change here | Verify logged-out dashboard/admin block |
| CRM Contacts | `/dashboard/crm` | `/api/crm/contacts` | Create/edit/delete persists only within current org | DB | Same org only | CRM view/manage access | Pass in code, needs live validation | Raw ID update/delete was unscoped | Added org check before update/delete | Direct API mismatch should now return 404 |
| CRM Companies | `/dashboard/crm` | `/api/crm/companies` | Create/edit/delete persists only within current org | DB | Same org only | CRM view/manage access | Pass in code, needs live validation | Raw ID update/delete was unscoped | Added org check before update/delete | Direct API mismatch should now return 404 |
| CRM Deals | `/dashboard/crm` | `/api/crm/deals` | Create/edit/delete persists only within current org | DB | Same org only | CRM view/manage access | Pass in code, needs live validation | Raw ID update/delete was unscoped | Added org check before update/delete | Direct API mismatch should now return 404 |
| Tasks | `/dashboard/crm`, `/dashboard/projects` | `/api/tasks`, `/api/projects/tasks` | Task mutations persist and stay scoped | DB | Same org only | Module access required | Needs live validation | No new defect confirmed here | None | Follow-up generator now fails honestly if DB is unavailable |
| Accounting Invoices | `/dashboard/accounting` | `/api/accounting/invoices`, `/api/ops/approvals` | Invoices load safely; approval state persists after refresh | DB + audit log | Same org only | Accounting view/manage | Pass in code, needs live validation | Approval lifecycle allowed duplicate/finalized actions | Enforced server approval state checks; UI disables invalid re-request | Invoice approval remains separate from financial lifecycle |
| Accounting Expenses | `/dashboard/accounting` | `/api/accounting/expenses`, `/api/ops/approvals` | Expenses load safely; approval decisions persist after refresh | DB + audit log | Same org only | Accounting view/manage | Pass in code, needs live validation | Approval lifecycle allowed duplicate/finalized actions | Enforced server approval state checks; expense DB status updates on decision | Reject/approve now survives refresh |
| Accounting Approvals | `/dashboard/accounting` | `/api/ops/approvals` | Request approval only once; no resubmit fake path | Audit log + source record | Same org only | Accounting manage | Pass in code, needs live validation | Duplicate/finalized requests were accepted | Added 409 conflict responses for invalid transitions | UI now labels rejected as resubmit not implemented |
| Operations Approvals | `/dashboard/operations` | `/api/ops/approvals` | Pending approvals list is persisted and org-scoped | Audit log + source record | Same org only | Operations manage | Pass in code, needs live validation | Prior client-only storage was already fixed; lifecycle checks were incomplete | Added server transition guards | Verify approve/reject in live UI after redeploy |
| Operations Reports | `/dashboard/operations` | none persisted | Must not pretend saved report state persists | No backend persistence | N/A | View/manage UI only | Not implemented | Fake local saved report persistence existed earlier | Already replaced with explicit non-persisted notice | Keep blocked until real backend exists |
| Operations Integrations | `/dashboard/operations` | env/provider-backed only | Must not pretend connected state persists without backend | Env/provider, not UI state | Workspace context only | View/manage UI only | Not implemented | Fake saved integration toggles existed earlier | Already replaced with explicit env-backed notice | Keep blocked until real backend exists |
| Playbooks | `/dashboard/playbooks` | `/api/playbooks` | Runs/status come from server only | DB | Same org only | Module access required | Needs live validation | Prior local fallback existed | Already removed in earlier P0 branch | Refresh must preserve run state |
| Workflows | `/dashboard/operations` | `/api/ops/workflows` | Update only records in current org | DB | Same org only | Operations manage | Pass in code, needs live validation | Raw ID update was unscoped | Added org check before update | Cross-org update should now 404 |
| HR / Payroll | `/dashboard/hr` | `/api/hr/payroll` | Payroll records persist; approval action must not pretend persistence | DB for payroll data | Same org only | HR access | Mixed: payroll data persisted, approval not implemented | Approval action used alert-only pseudo-flow | Disabled action and labeled as not implemented | Real payroll approval backend still absent |
| Inventory / Purchase Orders | `/dashboard/inventory` | `/api/inventory/orders` | Orders persist; approval action must not pretend persistence | DB for orders | Same org only | Inventory access | Mixed: order data persisted, approval not implemented | Approval action used alert-only pseudo-flow | Disabled action and labeled as not implemented | Real purchase approval backend still absent |
| Settings / Workspace | `/dashboard/settings` | `/api/user/settings`, `/api/admin/workspace` | Persist only actual supported fields and fail honestly on errors | DB | Own org / workspace | Authenticated + admin for workspace | Pass in code, needs live validation | Dev fallback API could fabricate success payloads | Removed simulated settings responses on API failure | Workspace name persists; unsupported fields still say so in UI |
| Settings / Security | `/dashboard/settings` | `/api/user/settings` | Must not claim security toggles persist if backend absent | Partial DB support + explicit UI notice | Own org only | Authenticated user | Not implemented | No new server bug; feature still intentionally partial | No code change in this sweep | Verify notice text after redeploy |
| Uploads / Gallery / Cloudinary | `/dashboard/gallery` | `/api/gallery`, `/api/uploads/cloudinary` | Gallery CRUD persists; uploads fail clearly if Cloudinary missing | DB + Cloudinary | Same org only | Gallery access | Pass in code, needs live validation | Cloudinary route returned fake data URL success in dev; gallery update/delete unscoped | Removed mocked upload success; added org checks to gallery update/delete | Missing config now returns real error |
| Notifications | header / dashboard | `/api/notifications` | Notifications come from DB only; email send reports real provider outcome | DB + SMTP | Same org only | Authenticated user | Pass in code, needs live validation | Dev in-memory fallback could fake persisted notifications | Removed simulated notification store and returns honest errors | SMTP missing still returns clear email error in response |
| Reports / Exports | docs / export actions | `/api/reports/export`, `/api/reports/exports`, `/api/reports/summary` | Real exports only; no fake sent state | DB / file response / SMTP if used | Same org only | Module access required | Needs live validation | No new defect confirmed in this pass | None | Must test export/email flows live |
| AI | `/dashboard/ai` | `/api/ai/chat` | Missing provider should fail clearly or use explicit fallback messaging | Env/provider + explicit fallback text | Same org/session | Authenticated user | Needs live validation | No new defect patched in this pass | None | Validate disabled/missing-key behavior live |
| Portal | `/portal/[code]` | `/api/portal/[code]/*` | Client portal stays scoped to its access code and org | DB + rate limiting | Portal workspace only | Portal user / code access | Needs live validation | No new defect confirmed in this pass | None | Recheck approvals and status updates live |
| Billing / Stripe | `/pricing`, billing surfaces | billing APIs | Missing config must fail closed and not imply live checkout | Env/provider | Workspace scoped | Billing-eligible roles only | Needs live validation | No new defect patched in this pass | None | Recheck disabled/missing-config messaging live |

## Unsafe Local / Fake Runtime Findings

| Finding | Classification | Status after sweep | Notes |
| --- | --- | --- | --- |
| Browser `localStorage` identity mirroring | Unsafe | Fixed in earlier P0 branch, retained here | Session is now source of truth |
| Invoice / expense approvals in browser storage | Unsafe | Fixed in earlier P0 branch, retained here | Server persistence via `/api/ops/approvals` |
| Duplicate/finalized approval transitions | Unsafe | Fixed in this sweep | Server now blocks duplicate request / finalized decision paths |
| Cloudinary mock upload success | Unsafe | Fixed in this sweep | Missing config now errors clearly |
| Follow-up simulated API results | Unsafe | Fixed in this sweep | API now returns real 503 on DB failure |
| Notification in-memory fallback | Unsafe | Fixed in this sweep | DB/API is now required |
| User settings simulated fallback payload | Unsafe | Fixed in this sweep | API now fails honestly |
| Payroll approval alert-only action | Unsafe business action | Marked not implemented | Disabled instead of pretending |
| Purchase approval alert-only action | Unsafe business action | Marked not implemented | Disabled instead of pretending |
| Theme / onboarding / PWA dismissal / local AI draft storage | Safe | Left as-is | UI-only state, not business source of truth |

## Approval Lifecycle Rules Now Enforced

- cannot request approval twice while pending
- cannot request approval again after approved
- cannot approve or reject an already finalised approval
- rejected invoice/expense records show that revise/resubmit is not implemented
- server enforces these rules through `/api/ops/approvals`
- Operations approvals still reflect persisted state only

## Remaining Intentional Non-Implemented Areas

- Operations saved reports persistence
- Operations integrations connection persistence
- Payroll approvals
- Purchase order approvals
- Security toggle persistence beyond the currently supported user settings fields

These areas must stay visibly marked as not implemented until a real backend is added.
