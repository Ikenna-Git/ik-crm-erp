# P0 Launch Blocker Register

Date: 2026-06-19
Branch: `p0-customer-demo-readiness-launch-automation`

| Blocker | Surface | Status | Fix / decision | Remaining evidence |
| --- | --- | --- | --- | --- |
| Logged-out route guard failure | `/dashboard`, `/admin`, admin APIs | Fixed | Server-side protected page guards and smoke coverage are already in place | Re-run smoke after redeploy |
| Founder vs workspace admin boundary | `/admin`, `/admin/system`, admin APIs | Fixed in code | Founder-only surfaces remain founder-only; org owners use workspace-only controls | Fresh founder/org-owner live retest |
| HR privacy lock posture | HR UI + API | Fixed in code, evidence pending | HR privacy PIN and API redaction are active | Wrong PIN, correct PIN, re-lock live evidence |
| Accounting privacy lock posture | Accounting UI + API | Fixed in code, evidence pending | Accounting privacy PIN and redaction are active | Wrong PIN, correct PIN, export and re-lock live evidence |
| Customer/demo launch readiness visibility | Founder admin plane | Fixed in code | Added founder Launch Readiness centre with provider diagnostics, module status, and evidence gaps | Browser validation after redeploy |
| Workspace setup honesty | `/dashboard/setup` and dashboard overview | Fixed in code | Added setup center driven by real signals instead of manual completion | Browser validation after redeploy |
| Marketing overclaim risk | Marketing | Fixed | Marketing remains preview-only and should stay visibly limited | Browser review after redeploy |
| Provider-backed feature ambiguity | SMTP / Cloudinary / Upstash / Stripe / AI / observability | Fixed in copy and diagnostics | Missing or partial provider config is now surfaced honestly | Provider-by-provider live validation |
| Invite flow evidence gap | Invite creation + acceptance | Open | Code boundaries are stronger; no fake completion states | Founder invite / accept / org-role live evidence |
| CRM persistence evidence gap | CRM | Open | CRM remains available, but launch sign-off still requires fresh CRUD proof | Contact/company/deal create-edit-refresh evidence |
| Approval lifecycle evidence gap | Accounting + Operations | Open | Approval persistence is real, but evidence must be refreshed | Request / approve / reject / refresh proof |
| Backup evidence gap | Ops / trust | Open | Product language stays honest; no fake sign-off | Real backup evidence required |
| Restore drill evidence gap | Ops / trust | Open | Product language stays honest; no fake sign-off | Real restore drill evidence required |
| Fake-data review gap | Demo / customer readiness | Open | Demo/sample guidance added; no fake customer claims should be made | Human review and evidence required |
