# P0 Final Launch Blocker and AI Sweep

Date: 2026-06-07
Branch: `p0-final-launch-blocker-ai-world-class-sweep`

## Scope
- HR / Accounting locked-detail leak
- Shared record-details dialog hardening
- Deterministic AI navigation and logout
- Civis Pulse and trust/status surfacing
- Honest Marketing preview state
- Landing / dashboard / sidebar polish
- Product and founder-demo documentation

## Fixed In Code
- Restricted HR and Accounting users can no longer rely on API responses to inspect sensitive amounts/contact details.
- AI now handles pricing, gallery, CRM, accounting, HR, inventory, marketing, settings, projects, operations, portal, admin, overview, and logout commands deterministically.
- AI now answers:
  - what can I do here?
  - what is blocked?
  - summarise this page
  - what should I do next?
  - help me set this up
- Dashboard now includes a real Civis Pulse layer with priorities, blockers, trust status, and next actions.
- Marketing is framed as preview-only rather than looking live.

## Still Requires Manual Validation
- Founder versus org-owner admin boundaries after redeploy
- Invite flow end-to-end on live Render
- Invoice / expense request-approve-refresh lifecycle on live Render
- CRM create / edit / delete after refresh
- Cloudinary, SMTP, Upstash, Stripe, and AI provider behaviour on live Render
- Backup, restore drill, and fake-data evidence
