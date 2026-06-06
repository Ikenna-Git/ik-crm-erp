# P0 Local Storage And Persistence Audit

Date: 2026-06-06  
Branch: `p0-core-runtime-bug-sweep`

## Purpose

This audit separates:

- browser storage that is acceptable for local UI convenience only
- browser storage that was incorrectly acting as a source of truth for core workflows
- server-side in-memory fallbacks that must not be treated as production persistence

Core rule:

- browser storage must not be the source of truth for approvals, accounting, operations state, workspace membership, roles, org identity, platform access, or admin decisions

## Classification Table

| File | Feature | Storage | Current purpose | Classification | Action required | Fixed |
| --- | --- | --- | --- | --- | --- | --- |
| `components/theme-toggle.tsx` | Theme preference | `localStorage` | remembers dark/light mode | Safe UI preference | Keep | No change needed |
| `hooks/use-cached-fetch.ts` | client read cache | `localStorage` | caches read-only API results with TTL | Safe read cache if cache misses refetch from API | Keep, but never treat cached values as authoritative after mutation | No change needed |
| `components/guided-onboarding.tsx` | onboarding progress | `localStorage` | local walkthrough completion | Safe UI helper | Keep | No change needed |
| `components/pwa-provider.tsx` | install banner dismissal | `localStorage` | hides repeat prompt | Safe UI preference | Keep | No change needed |
| `app/(dashboard)/dashboard/demo/page.tsx` | demo video list | `localStorage` | demo-only local media list | Safe demo-only local state | Keep out of core workflow claims | No change needed |
| `lib/ai-assist.ts` | AI instruction seed | `localStorage` | local assistant prompt memory | Safe temporary client convenience | Keep | No change needed |
| `components/ai-assist-popover.tsx` | AI chat history and open state | `localStorage` | preserves local chat draft/history | Safe temporary client convenience | Keep, but not a business record | No change needed |
| `app/(dashboard)/dashboard/ai/page.tsx` | AI conversation draft | `localStorage` | local chat history | Safe temporary client convenience | Keep, but not a business record | No change needed |
| `app/(dashboard)/dashboard/accounting/page.tsx` | finance unlock code | `localStorage` | local sensitive-view unlock toggle | Safe local browser gate only | Keep clearly separate from server auth | No change needed |
| `components/hr/payroll-table.tsx` | payroll unlock code | `localStorage` | local sensitive-view unlock toggle | Safe local browser gate only | Keep clearly separate from server auth | No change needed |
| `components/hr/employees-table.tsx` | HR unlock code | `localStorage` | local sensitive-view unlock toggle | Safe local browser gate only | Keep clearly separate from server auth | No change needed |
| `app/(dashboard)/layout.tsx` | dashboard identity mirror | `localStorage` | cached session user in browser | Unsafe identity source | Removed local write; session is source of truth | Yes |
| `components/dashboard-header.tsx` | header user identity | `localStorage` | read cached user name | Unsafe identity source | Removed local read; now follows session/event only | Yes |
| `components/dashboard-sidebar.tsx` | logout identity cleanup | `localStorage` | removed cached user | Unsafe identity path | Removed local identity dependency | Yes |
| `lib/user-settings.ts` | request headers / local user sync | `localStorage` | derived `x-user-*` headers and profile sync from browser cache | Unsafe identity source | Removed browser identity fallback; keep event-only profile sync | Yes |
| `lib/approvals.ts` | approvals queue | `localStorage` | old approval source of truth | Unsafe business state | Deleted after migration to server-backed approvals | Yes |
| `app/(dashboard)/dashboard/operations/page.tsx` | approvals | `localStorage` before fix | approvals list and decisions | Unsafe business state | Moved to `/api/ops/approvals` | Yes |
| `app/(dashboard)/dashboard/operations/page.tsx` | integrations | local React state only | implied saved connect/disconnect state | Unsafe if treated as persisted | UI now says provider/env-backed only; no fake toggle persistence | Yes |
| `app/(dashboard)/dashboard/operations/page.tsx` | saved reports | local React state only | implied saved reports | Unsafe if treated as persisted | UI now explicitly reports not persisted | Yes |
| `app/(dashboard)/dashboard/playbooks/page.tsx` | playbook runs fallback | `localStorage` before fix | fallback run state and fake progress | Unsafe business state | Removed fallback and fake optimistic persistence | Yes |
| `components/hr/payroll-table.tsx` | payroll approvals | `localStorage` via `lib/approvals` | approval request queue | Unsafe business state | Removed fake approval creation; now shows explicit not-persisted message | Yes |
| `components/inventory/orders-table.tsx` | purchase approvals | `localStorage` via `lib/approvals` | approval request queue | Unsafe business state | Removed fake approval creation; now shows explicit not-persisted message | Yes |
| `app/(dashboard)/dashboard/settings/page.tsx` | security settings | `localStorage` before fix | fake save of security toggles | Unsafe admin/state claim | Removed fake save; now shows non-persisted notice | Yes |
| `app/(dashboard)/dashboard/settings/page.tsx` | workspace settings | `localStorage` before fix | fake save of workspace settings | Unsafe admin/state claim | Workspace name now uses `/api/admin/workspace`; unsupported fields show explicit notice | Yes |
| `lib/store.ts` | demo in-memory store | server memory | demo data only | Unsafe for production, but not browser storage | Document as demo-only, never production persistence | No code change in this pass |
| `app/api/notifications/route.ts` | dev notifications fallback | server memory | dev-only simulated notifications | Safe only in dev fallback mode | Keep documented as non-production fallback | No change needed |

## Persisted Core Runtime Paths Verified In Code

- accounting approvals:
  - request via `POST /api/ops/approvals`
  - decisions via `PATCH /api/ops/approvals`
  - invoice approval state derived from server data
  - expense approval decision also updates `Expense.status`
- playbooks:
  - load via `GET /api/playbooks`
  - launch via `POST /api/playbooks`
  - advance/pause via `PATCH /api/playbooks`
- workspace name:
  - load/save via `/api/admin/workspace`

## Remaining Known Limitations

- there is no dedicated persisted backend for:
  - operations custom saved reports
  - operations integration connection toggles
  - payroll approval workflow
  - purchase order approval workflow
  - settings security toggles shown in the workspace settings screen
- the UI now reports these limits explicitly instead of pretending they were saved

## Validation Rules

For any future bug check:

1. trigger the action
2. refresh the page
3. if possible, sign out and back in
4. confirm the same state comes back from an API or database-backed route
5. if the state disappears, it is not a valid persisted workflow
