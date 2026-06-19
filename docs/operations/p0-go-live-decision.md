# P0 Go-Live Decision

Date: 2026-06-19
Branch: `p0-permanent-admin-centre-privacy-pins-and-motion-performance`

## Current Decision
- Go live now: `No`
- Demo-ready now: `Mostly yes, with explicit limits`
- Customer-ready now: `Not yet`

## Why Go-Live Is Still Blocked
- Org-managed HR and Accounting privacy PINs are now built into Civis, but fresh live set/rotate/unlock evidence is still required
- Workspace Admin Center needs browser validation with real admin accounts
- Invite flow still needs fresh live evidence
- CRM create/edit/refresh evidence still needs capture
- Accounting and Operations approval lifecycle still needs fresh live evidence
- HR privacy PIN and Accounting privacy PIN still need launch-window proof
- Provider-backed flows still need real validation where configured
- Backup, restore drill, and fake-data review evidence are still missing

## What Is Strong Enough To Demo
- Landing page and pricing honesty
- Login and dashboard access posture
- Civis Pulse and setup blockers
- Founder-only versus workspace-admin separation
- Workspace Admin Center for users, privacy locks, offboarding, and setup review
- Marketing preview-only honesty
- Civis Guide deterministic navigation
- Launch Readiness centre
- Workspace Setup centre
- Honest launch-status meanings: Ready, Limited, Action Required, Missing, Preview Only

## What Must Be Framed Carefully
- SMTP, Cloudinary, Upstash, Stripe, AI provider, and observability states
- Any billing claim beyond test-mode or configuration status
- Any backup / restore or production-ops claim without evidence
- Any customer-style story that depends on fake data
- Any claim that force sign-out is fully global before JWT session invalidation is hardened

## Decision Rule
Move to go-live only when:
1. `npm run build` passes on the release branch.
2. Smoke test passes against the deployed Render app.
3. Founder, org-owner, and restricted-user checks are recorded.
4. Invite, CRM, approval, HR privacy, and Accounting privacy flows are evidenced live.
5. Backup / restore / fake-data review evidence is logged.

Until then, Civis is valid for guided demos and internal validation, not full go-live approval.
