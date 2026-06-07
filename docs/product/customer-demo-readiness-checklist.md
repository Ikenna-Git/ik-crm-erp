# Customer Demo Readiness Checklist

Date: 2026-06-07

| Page | Role | Expected behaviour | Demo risk | Pass / Fail | Evidence | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | public | Hero, proof, CTA, pricing honesty all feel credible | Medium |  |  |  |
| Pricing | public | Sign-up CTA only, no implied live self-serve checkout | High |  |  |  |
| Login | public | Auth works, no malformed responses | High |  |  |  |
| Dashboard | authenticated | Civis Pulse loads with honest states | High |  |  |  |
| AI assistant | authenticated | Deterministic commands navigate or log out correctly | High |  |  |  |
| CRM | CRM user | Contacts / companies / deals persist after refresh | High |  |  |  |
| Accounting | finance user | Invoices / expenses / approvals persist after refresh | High |  |  |  |
| HR | HR manager | Confidential details visible only to authorized roles | High |  |  |  |
| Operations | ops/admin | Approvals list and actions remain org-scoped | High |  |  |  |
| Marketing | any allowed user | Preview-only messaging, no fake success | Medium |  |  |  |
| Settings | authenticated | Supported settings persist, unsupported ones stay honest | Medium |  |  |  |
| Admin | founder / org owner | Founder controls and workspace controls remain separated | High |  |  |  |
| Locked states | restricted user | No details leak from dialogs, menus, or APIs | High |  |  |  |
| Provider states | relevant role | Missing config fails safely and clearly | High |  |  |  |
