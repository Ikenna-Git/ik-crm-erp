# P0 Core Runtime Bug Sweep

Date: 2026-06-06  
Branch: `p0-core-runtime-bug-sweep`  
Primary scope: accounting approvals, accounting runtime, operations approvals, invite/admin regression, login/dashboard regression, env-backed failure states, browser-storage persistence audit

## Build Investigation

| Item | Result |
| --- | --- |
| Investigated command | `rm -rf .next && npx prisma generate && npm run build` |
| Initial symptom | Build appeared stuck at `Creating an optimized production build ...` when stopped early |
| Diagnostic result | Not a deadlock or compile failure; webpack continued compiling and the build completed when given enough time |
| Verified completion | `Compiled successfully in 65s`, then static page generation and trace collection completed |
| Total observed wall time | roughly 140 seconds from build start to route output in this environment |
| Root cause | Slow but valid webpack production build, not a persistence-audit regression |
| Branch-caused defect | No confirmed branch-specific build defect found |
| Remaining risk | Build can be misread as hung if stopped before the compile phase completes; allow at least 2 to 3 minutes before classifying as blocked |

## Test Matrix

| Test Area | Route/Page | Expected Result | Actual Result | Bug Found | Fix Made | Evidence / Notes | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Invoice approval request | `/dashboard/accounting` invoices tab | Request approval persists to server and appears in Operations approvals after refresh | Local storage only before fix | Yes | Added `/api/ops/approvals` server persistence via `AuditLog`; accounting UI now calls API | Verify request appears after refresh and on another session in same org |  |  |
| Expense approval request | `/dashboard/accounting` expenses tab | Request approval persists to server and appears in Operations approvals after refresh | Local storage only before fix | Yes | Added `/api/ops/approvals` server persistence via `AuditLog`; accounting UI now calls API | Verify request appears after refresh and on another session in same org |  |  |
| Invoice approval decision | `/dashboard/operations` approvals tab | Approve/reject persists; invoice approval state stays correct after refresh | Client-only status mutation before fix | Yes | Operations approvals now `PATCH /api/ops/approvals`; invoice approval state comes from DB-backed audit log | Invoice financial status stays separate from approval state |  |  |
| Expense approval decision | `/dashboard/operations` approvals tab | Approve/reject persists; expense status changes from Pending to Approved/Rejected after refresh | Client-only status mutation before fix | Yes | Operations approvals now `PATCH /api/ops/approvals`; expense row updates in DB | Confirm `/api/accounting/expenses` returns updated status |  |  |
| Operations approvals list | `/dashboard/operations` approvals tab | Shows org-scoped persisted approvals only | Local browser-only list before fix | Yes | Replaced local storage reads with `GET /api/ops/approvals` | No cross-org approvals should appear |  |  |
| Accounting invoices load | `/dashboard/accounting` invoices tab | Invoices load without crash and reflect DB approval state |  |  |  | Check console and server logs if load fails |  |  |
| Accounting expenses load | `/dashboard/accounting` expenses tab | Expenses load without crash and reflect DB approval state |  |  |  | Check console and server logs if load fails |  |  |
| Accounting summary widgets | `/dashboard/accounting` | Widgets render safely; no page-wide runtime crash |  |  |  | Confirm empty/error states are contained |  |  |
| Invoice create/edit | `/dashboard/accounting` invoices tab | Create/edit persists only within current org |  |  |  | Server route must scope by `orgId` |  |  |
| Expense create/edit | `/dashboard/accounting` expenses tab | Create/edit persists only within current org |  |  |  | Server route must scope by `orgId` |  |  |
| Accounting cross-org isolation | `/api/accounting/invoices`, `/api/accounting/expenses` | No cross-org reads, updates, or deletes | Raw ID mutation was possible before fix | Yes | Update/delete now verify current `orgId` first | Recheck with direct URL or mismatched record ID if practical |  |  |
| Logged-out dashboard block | `/dashboard` | Redirect, block, or auth-required response |  |  |  | No default-org leakage |  |  |
| Logged-out admin block | `/admin` | Redirect, block, or auth-required response |  |  |  | No founder/admin leak |  |  |
| Normal user login | `/login` | Login succeeds and lands in correct workspace |  |  |  | Check no identity flash or wrong workspace |  |  |
| Invited org owner login | `/login` | Login succeeds and lands only in invite org |  |  |  | Reuse invited test user but do not special-case code for one email |  |  |
| Founder Desk access | `/admin`, `/admin/system` | Founder/SUPER_ADMIN can access founder surfaces |  |  |  | Use founder account only |  |  |
| Org owner founder block | `/admin`, `/admin/system` | Org owner cannot see Founder Desk or system pages |  |  |  | UI and API must both block |  |  |
| Org-scoped user list | `/admin/users`, `/api/admin/users` | Org owner sees same-org users only; founder user excluded |  |  |  | Validate after latest org-boundary fix |  |  |
| Platform APIs blocked for org owner | `/api/admin/orgs`, `/api/admin/platform-status` | Non-founder gets forbidden/blocked |  |  |  | Recheck after latest boundary fix |  |  |
| Operations integrations state | `/dashboard/operations` integrations tab | UI must not imply persisted connect/disconnect state without backend | Local toggle implied saved integration state before fix | Yes | Removed fake toggle persistence; UI now reports environment-backed setup only | Render env/provider is source of truth |  |  |
| Saved report state | `/dashboard/operations` reports tab | UI must not imply report persistence without backend | Local saved report state before fix | Yes | Removed fake saved-report persistence; UI now shows explicit not-persisted notice | Do not treat this UI as source of truth |  |  |
| Playbook launch/update persistence | `/dashboard/playbooks` | Launch/progress/pause reflect API-backed state only | Local fallback and fake optimistic state before fix | Yes | Removed local fallback and fake progression; state now updates only from API responses | Refresh must keep same run status |  |  |
| Workspace settings persistence | `/dashboard/settings` workspace/security sections | UI must only report fields actually persisted | Local fake save state before fix | Yes | Workspace name now persists through `/api/admin/workspace`; non-persisted fields show explicit notice | Security toggles still require backend work before claiming persistence |  |  |
| Browser identity mirror | dashboard layout/header/sidebar | Session identity must come from NextAuth/session, not local browser storage | Browser `localStorage("user")` was being treated as identity source | Yes | Removed local identity mirror writes and reads; header updates now follow session + in-memory event | Prevents stale browser-only identity drift |  |  |
| SMTP missing-config behavior | invite/email actions | Missing SMTP config fails clearly, not silently |  |  |  | Message should explain config/admin action needed |  |  |
| Cloudinary missing-config behavior | upload flows | Missing Cloudinary config fails clearly, not silently |  |  |  | No fake upload success |  |  |
| Upstash missing-config behavior | auth/portal/rate-limited routes | Missing shared limiter fails safely with clear behavior |  |  |  | No fake “protected” state |  |  |
| AI missing-config behavior | AI routes/widgets | Missing provider/key disables or errors clearly |  |  |  | No fake assistant success |  |  |
| Stripe missing-config behavior | billing/pricing/checkout | Missing billing config fails closed and does not imply live checkout |  |  |  | No fake payment success |  |  |

## Focused Live Validation Steps

### 1. Accounting approval path
1. Create or choose an invoice in the current workspace.
2. Click `Request approval`.
3. Refresh `/dashboard/accounting`.
4. Confirm the invoice still shows `pending` approval state.
5. Open `/dashboard/operations` -> `Approvals`.
6. Confirm the same approval appears once, scoped to the current org.
7. Approve it from Operations.
8. Refresh both Operations and Accounting.
9. Confirm the invoice still belongs to the same org and now shows `approved`.

### 2. Expense approval path
1. Create or choose an expense in the current workspace.
2. Click `Request approval`.
3. Confirm it appears in Operations approvals.
4. Approve it from Operations.
5. Refresh `/dashboard/accounting`.
6. Confirm the expense now shows `approved` and remains approved after refresh.
7. Repeat once for reject if the reject path is part of the release criteria.

### 3. Operations scoping
1. Sign in as a workspace admin in one org.
2. Open `/dashboard/operations`.
3. Confirm approvals only reference source records from that org.
4. Confirm there is no approval leakage from another org.

### 4. Regression checks
1. Re-run login/dashboard checks from the latest org-boundary fix.
2. Re-run `/admin/users`, `/api/admin/orgs`, and `/api/admin/platform-status` checks for founder vs org owner.
3. Confirm founder-only surfaces are still blocked for org owners after the approval fix.

## Notes

- Approval persistence in this branch is DB-backed through `AuditLog` entries plus source-record updates for expenses.
- There is no dedicated `ApprovalRequest` Prisma model in the current schema. Approval workflow persistence currently relies on:
  - `AuditLog` rows for approval request/decision history
  - source-record status updates where applicable, such as `Expense.status`
- The old browser-only approvals helper (`lib/approvals.ts`) has been removed from the runtime path and deleted.
- Invoice approval state is distinct from invoice financial lifecycle status.
- Expense approval decisions also update the `Expense.status` field so Operations counters and accounting views stay consistent.
- Browser storage is now explicitly limited to UI-only behavior such as theme, onboarding progress, temporary local AI chat history, and access-code unlock flags. Core workflows must not depend on it.
- Build status after investigation:
  - `npm run build` passes on this branch
  - `npm run lint` still fails because `eslint` is not installed in this repo state
- Any live failure should record:
  - route/page
  - expected vs actual
  - browser console error
  - server error/log line
  - affected org and role
