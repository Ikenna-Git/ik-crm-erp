# P0 Full Launch Readiness Audit

Date: 2026-06-07  
Branch: `p0-full-launch-readiness-audit`

## Scope

This audit covers launch-facing P0 and P1 risks only:

- auth and route security
- org and data isolation
- persistence and fake-success removal
- CRM launch paths
- accounting and approvals
- operations
- settings
- uploads and provider-backed features
- billing/payment readiness
- UI launch quality
- error handling
- fake-data hygiene
- backup / restore / observability evidence status

## Audit Summary

| Area | Route / page / API | Issue found | Severity | Fix made | Evidence needed | Status | Owner | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth and route security | `/dashboard`, `/admin`, `/api/admin/orgs`, `/api/admin/platform-status` | Logged-out access had already been fixed before this branch; re-audited code path | P0 | No new code change in this branch | Live smoke/browser confirmation | Pass in code / live evidence partly present | Engineering | 2026-06-07 |
| Org and admin boundary | `/admin/users`, `/admin/system`, `/api/admin/*` | Prior founder/org-owner guard fix preserved | P0 | No new code change in this branch | Live founder/org-owner retest | Pass in code / blocked for live | Engineering | 2026-06-07 |
| Prototype/debug UI | CRM, accounting, HR, inventory, projects, admin, settings, operations, portal, analytics, demo | Main still contained raw JSON alerts, native prompt/confirm, and console-backed fake flows | P0 | Cherry-picked verified prototype/debug UI sweep from `2fc9971` | Live screen checks | Fixed in code | Engineering | 2026-06-07 |
| Public pricing honesty | `/pricing` | Page implied self-serve live billing and had dead CTA buttons | P0 | Reworded page to onboarding-assisted billing, routed CTAs to `/signup`, removed misleading payment-method claim | Live public-page review | Fixed in code | Engineering | 2026-06-07 |
| Portal approval lifecycle | `/api/portal/[code]/approvals` | Already-approved or rejected portal updates could be re-finalized | P1 | Added server-side `PENDING` guard and `409` on finalized states | Manual portal approval retest | Fixed in code | Engineering | 2026-06-07 |
| User settings API residue | `/api/user/settings` | Dead simulated fallback builder remained in source | P1 | Removed unused simulated fallback code | None beyond build/runtime | Fixed in code | Engineering | 2026-06-07 |
| AI follow-up status messaging | `/dashboard/ai` | UI still contained dead simulated-success branch no longer produced by API | P1 | Removed stale simulated branch | Manual AI follow-up UI check | Fixed in code | Engineering | 2026-06-07 |
| PWA debug logging | `components/pwa-provider.tsx` | Console logging remained in install/service worker flow | P2 | Removed browser debug logs | Browser/PWA spot check | Fixed in code | Engineering | 2026-06-07 |
| CRM persistence | `/dashboard/crm`, `/api/crm/*`, `/api/crm/followups` | No new cross-org or fake-success defect confirmed in this pass | P0 | No change | Live CRUD + follow-up evidence | Blocked for live | Engineering | 2026-06-07 |
| Accounting approvals | `/dashboard/accounting`, `/dashboard/operations`, `/api/ops/approvals` | Prior server-backed approval lifecycle fix preserved | P0 | No new change | Live request/approve/reject refresh evidence | Blocked for live | Engineering | 2026-06-07 |
| Operations honesty | `/dashboard/operations` | Integrations/reports already label unsupported persistence honestly | P1 | No new change | Live UI review | Pass in code / blocked for live | Engineering | 2026-06-07 |
| Settings honesty | `/dashboard/settings`, `/api/user/settings`, `/api/admin/workspace` | Workspace/security unsupported fields already message honestly | P1 | No new change beyond dead-code cleanup | Live save/refresh check | Pass in code / blocked for live | Engineering | 2026-06-07 |
| Upload/provider-backed features | `/api/uploads/cloudinary`, notifications, AI, billing readiness surfaces | Code paths are fail-closed/clear, but provider evidence is still missing | P0 | No new change | Live provider validation | Blocked | Engineering / Ops | 2026-06-07 |
| Fake-data hygiene | multiple pages/components | Mock/demo builders remain in component files, but audited pages load from APIs and clear to empty on request failure | P1 | No code change; documented for DB review | Live DB/fake-data review evidence | Blocked | Engineering / Ops | 2026-06-07 |
| Backup / restore / observability | docs/env readiness | No evidence of completed drill or verified alerts in this branch | P0 | No code change | Backup/restore and alerting evidence | Blocked | Ops | 2026-06-07 |

## Modules Checked

- auth and protected layouts
- admin shell and founder/org-owner APIs
- CRM page and CRUD APIs
- accounting page and approval APIs
- operations page, webhook, workflow, and approvals APIs
- settings page and settings APIs
- portal approval API
- pricing page
- Cloudinary upload API
- notifications API and helper
- AI follow-up UI path
- PWA provider

## Confirmed Code Fixes In This Branch

- `2fc9971` cherry-picked onto this branch to remove prototype/debug UI from launch flows
- pricing page now routes users into sign-up instead of implying live self-serve checkout
- portal approvals now fail closed once an item is already approved or rejected
- stale simulated settings and AI UI branches removed
- browser debug logging removed from the PWA install flow

## Remaining Manual Evidence Required

- founder vs org-owner admin regression
- invite flow end to end
- invoice and expense approval lifecycle after refresh
- CRM CRUD after refresh
- portal approval browser flow
- workspace/profile save checks
- Cloudinary configured and missing-config checks
- SMTP invite/notification checks
- Upstash/rate-limit behavior
- billing/Stripe validation or explicit blocked decision
- fake-data review on live data source
- backup, restore, and observability evidence
