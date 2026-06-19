# Customer Demo Readiness Checklist

Date: 2026-06-19

| Page / flow | Role | Expected behaviour | Demo risk | Pass / Fail / Blocked | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | Public | Premium, responsive, no fake claims, CTA links work | Medium |  |  |  |
| Pricing | Public | Honest pricing, no implied live billing unless validated | High |  |  |  |
| Login | Public | Real auth entry, no malformed response | High |  |  |  |
| Dashboard | Authenticated | Civis Pulse loads with honest blockers and next actions | High |  |  |  |
| Setup centre | Authenticated | Real statuses only, no manual fake completion | High |  |  |  |
| AI assistant | Authenticated | Deterministic commands work; provider mode stays honest | High |  |  |  |
| CRM | Workspace user | Contact/company/deal flow persists after refresh | High |  |  |  |
| Accounting | Finance user | Invoices/expenses load; approval flow behaves honestly | High |  |  |  |
| Operations | Ops/admin | Approval queue is org-scoped and persistent | High |  |  |  |
| HR privacy | HR manager | Locked by default, unlocked only after valid PIN | High |  |  |  |
| Accounting privacy | Finance manager | Locked by default, unlocked only after valid PIN | High |  |  |  |
| Gallery | Allowed user | Upload succeeds if configured, fails clearly if not | Medium |  |  |  |
| Settings | Authenticated | Supported settings persist or fail honestly | Medium |  |  |  |
| Admin | Founder / org owner | Founder and workspace admin experiences remain separated | High |  |  |  |
| Launch readiness | Founder | Provider diagnostics and evidence gaps visible, no secret leak | High |  |  |  |
| Marketing | Any allowed user | Preview-only state is explicit, no fake success | Medium |  |  |  |
