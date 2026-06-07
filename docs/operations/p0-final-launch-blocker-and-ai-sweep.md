# P0 Final Launch Blocker and AI Sweep

Date: 2026-06-07
Branch: `p0-final-launch-blocker-ai-world-class-sweep`

## Scope
- HR / Accounting privacy lock restoration
- Shared record-details dialog hardening
- Deterministic AI navigation and logout
- Civis Pulse and trust/status surfacing
- Honest Marketing preview state
- Landing / dashboard / sidebar polish
- Product and founder-demo documentation

## Fixed In Code
- HR and Accounting now use separate session-scoped privacy PIN unlocks for authorized managers.
- Restricted HR and Accounting users can no longer rely on API responses to inspect sensitive amounts/contact details.
- Locked modules now hide row actions, details, and exports until the correct module PIN is unlocked.
- AI now handles pricing, gallery, CRM, accounting, HR, inventory, marketing, settings, projects, operations, portal, admin, overview, and logout commands deterministically.
- AI now answers:
  - what can I do here?
  - what is blocked?
  - summarise this page
  - what should I do next?
  - help me set this up
- AI is now framed as Civis Guide instead of a generic chatbot.
- Dashboard now includes a real Civis Pulse layer with priorities, blockers, trust status, and next actions.
- Marketing is framed as preview-only rather than looking live.
- Landing page now tells a stronger premium, governed, AI-native story.

## Still Requires Manual Validation
- HR privacy PIN unlock / wrong PIN / relock flow on live Render
- Accounting privacy PIN unlock / wrong PIN / relock flow on live Render
- Founder versus org-owner admin boundaries after redeploy
- Invite flow end-to-end on live Render
- Invoice / expense request-approve-refresh lifecycle on live Render
- CRM create / edit / delete after refresh
- Cloudinary, SMTP, Upstash, Stripe, and AI provider behaviour on live Render
- Backup, restore drill, and fake-data evidence
