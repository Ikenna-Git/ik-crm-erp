# P0 Launch Blocker Register

Date: 2026-06-07  
Branch: `p0-launch-ux-world-class-sweep`

| Area | Route / page / API | Issue found | Severity | Fix made | Evidence needed | Status | Owner | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public pricing | `/pricing` | Public page implied live payments despite no validated self-serve checkout evidence | P0 | Copy and CTAs changed to sign-up / onboarding-assisted billing only | Public page review after redeploy | Fixed in code | Engineering | 2026-06-07 |
| HR detail leakage | `/dashboard/hr`, `/api/hr/*` | Employee and payroll views relied on browser-local unlock codes; masked screens could still hold full detail data client-side | P0 | Replaced local unlock behavior with role-based redaction and disabled actions for non-manage roles | Live HR shell/detail validation by role | Fixed in code | Engineering | 2026-06-07 |
| Accounting detail leakage | `/dashboard/accounting`, `/api/reports/export` | Accounting shell masked amounts locally, but details/exports were not consistently entitlement-based | P0 | Removed local finance unlock pattern from UI and enforced export access by module + manage level on server | Live accounting role validation and export checks | Fixed in code | Engineering | 2026-06-07 |
| CRM field persistence honesty | `/dashboard/crm` Deal Fields | Deal field modal overflowed and could fake local-only persistence when DB path was unavailable | P1 | Added scroll-safe modal layout and removed local-only field save fallback | Browser verification in CRM pipeline view | Fixed in code | Engineering | 2026-06-07 |
| Marketing honesty | `/dashboard/marketing` | Module still looked actionable despite no real persistence/sending | P1 | Disabled interactive-looking actions and marked the module preview-only | Browser review of preview-only messaging | Fixed in code | Engineering | 2026-06-07 |
| Portal approvals | `/api/portal/[code]/approvals` | Finalized portal approvals could be re-decided | P1 | Added server-side `PENDING`-only transition guard | Manual portal approval retest | Fixed in code | Engineering | 2026-06-07 |
| Launch-facing UI trust | Multiple dashboard/admin screens | Native browser dialogs, raw JSON popups, and fake create/debug output were still present on main | P0 | Cherry-picked `Remove prototype debug UI from launch flows` | Run prototype/debug UI screen checks | Fixed in code | Engineering | 2026-06-07 |
| Founder/org-owner boundary | `/admin`, `/admin/system`, `/api/admin/orgs`, `/api/admin/platform-status`, `/admin/users` | Must be re-proven on live after latest merges | P0 | Prior fixes preserved; no new change here | Founder/org-owner browser/API validation | Blocked pending live evidence | Engineering | 2026-06-07 |
| Accounting approvals | `/dashboard/accounting`, `/dashboard/operations`, `/api/ops/approvals` | Must be re-proven on live after latest merges | P0 | Prior fixes preserved; no new change here | Request/approve/reject refresh evidence | Blocked pending live evidence | Engineering | 2026-06-07 |
| CRM persistence | `/dashboard/crm`, `/api/crm/*` | Must be re-proven on live after latest merges | P0 | Prior fixes preserved; no new change here | CRUD and follow-up evidence | Blocked pending live evidence | Engineering | 2026-06-07 |
| Provider-backed features | uploads, SMTP, Upstash, AI, Stripe | Code is fail-closed/clear but provider evidence is still missing | P0 | No code change in this branch | Provider validation or blocked signoff | Blocked | Engineering / Ops | 2026-06-07 |
| Backup / restore | ops evidence | No verified drill evidence in repo state | P0 | No code change | Backup + restore evidence | Blocked | Ops | 2026-06-07 |
| Observability | alerting/webhook/Sentry evidence | No verified alert delivery evidence in repo state | P1 | No code change | Alerting evidence | Blocked | Ops | 2026-06-07 |
| Fake-data review | live DB / seeded/demo data | No confirmed production data hygiene review evidence | P1 | No code change | Fake-data audit evidence | Blocked | Ops / Engineering | 2026-06-07 |
