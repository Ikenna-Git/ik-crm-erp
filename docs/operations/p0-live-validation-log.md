# P0 Live Validation Log

Date: 2026-06-07

## Recorded Live Evidence
- Smoke test against `https://ik-crm-erp.onrender.com`
  - command: `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke`
  - result: `25 checks`, `0 fail`, protected page route guard fix confirmed live
  - logged-out `/dashboard` blocked with `307 -> /login`
  - logged-out `/admin` blocked with `307 -> /login`
  - logged-out `/api/admin/orgs` blocked with `401`
  - logged-out `/api/admin/platform-status` blocked with `401`

## New Manual Validation Required After This Sweep
- HR privacy PIN unlock / wrong PIN / relock flow
- Accounting privacy PIN unlock / wrong PIN / relock flow
- AI deterministic commands on live Render
- HR restricted-user redaction on live Render
- Accounting restricted-user redaction on live Render
- Civis Pulse rendering on live Render
- Founder trust/status area on live Render
- Marketing preview-only messaging on live Render
- Landing page premium redesign on mobile and desktop
