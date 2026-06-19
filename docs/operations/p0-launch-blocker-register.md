# P0 Launch Blocker Register

Date: 2026-06-19
Branch: `p0-permanent-admin-centre-privacy-pins-and-motion-performance`

## Permanent Product Standard
- Env-only privacy PIN setup is rejected as the customer path.
- Organisation-owned controls must be managed inside Civis wherever safely possible.
- Privacy PIN rotation and force-lock are now org-managed admin controls, not Render steps.

| Blocker | Surface | Status | Fix / decision | Remaining evidence |
| --- | --- | --- | --- | --- |
| Logged-out route guard failure | `/dashboard`, `/admin`, admin APIs | Fixed | Server-side protected page guards and smoke coverage are already in place | Re-run smoke after redeploy |
| Founder vs workspace admin boundary | `/admin`, `/admin/system`, admin APIs | Fixed in code | Founder-only surfaces remain founder-only; org owners use workspace-only controls | Fresh founder/org-owner live retest |
| HR privacy lock posture | HR UI + API + Workspace Admin Center | Fixed in code, evidence pending | HR privacy PIN is now org-managed in Civis, stored hashed, and unlock cookies are versioned so rotation force-locks active sessions. | Set PIN, wrong PIN, correct PIN, re-lock, rotate, and cross-role live evidence |
| Accounting privacy lock posture | Accounting UI + API + Workspace Admin Center | Fixed in code, evidence pending | Accounting privacy PIN is now org-managed in Civis, stored hashed, and export/details remain blocked until unlocked for the current org/session version. | Set PIN, wrong PIN, correct PIN, export, approval, re-lock, rotate live evidence |
| Workspace Admin Center foundation | `/dashboard/admin` | Fixed in code, evidence pending | Added a dedicated org admin centre for users/invites, privacy locks, offboarding, access review, setup, and audit visibility. | Browser validation with founder, org admin, and member roles |
| Force sign-out control | Workspace security | Limited | Current JWT session model does not guarantee global sign-out invalidation yet, so the UI stays honest and uses PIN rotation / force-lock for sensitive modules instead of fake completion. | Future auth hardening or session-versioning work |
| Landing cursor and motion performance | `/` | Fixed in code, evidence pending | System cursor is now default, custom cursor is opt-in, and landing motion/glow load was reduced. | Manual browser performance check on laptop/mobile |
| Customer/demo launch readiness visibility | Founder admin plane | Fixed in code | Added founder Launch Readiness centre with provider diagnostics, module status, and evidence gaps | Browser validation after redeploy |
| Workspace setup honesty | `/dashboard/setup` and dashboard overview | Fixed in code | Setup center now keeps provider-backed tasks limited or action-required until evidence exists | Browser validation after redeploy |
| Marketing overclaim risk | Marketing | Fixed | Marketing remains preview-only and should stay visibly limited | Browser review after redeploy |
| Provider-backed feature ambiguity | SMTP / Cloudinary / Upstash / Stripe / AI / observability | Fixed in copy and diagnostics | Missing or partial provider config is now surfaced honestly | Provider-by-provider live validation |
| Invite flow evidence gap | Invite creation + acceptance | Open | Code boundaries are stronger; no fake completion states | Founder invite / accept / org-role live evidence |
| CRM persistence evidence gap | CRM | Open | CRM remains available, but launch sign-off still requires fresh CRUD proof | Contact/company/deal create-edit-refresh evidence |
| Approval lifecycle evidence gap | Accounting + Operations | Open | Approval persistence is real, but evidence must be refreshed | Request / approve / reject / refresh proof |
| Backup evidence gap | Ops / trust | Open | Product language stays honest; no fake sign-off | Real backup evidence required |
| Restore drill evidence gap | Ops / trust | Open | Product language stays honest; no fake sign-off | Real restore drill evidence required |
| Fake-data review gap | Demo / customer readiness | Open | Demo/sample guidance added; no fake customer claims should be made | Human review and evidence required |
