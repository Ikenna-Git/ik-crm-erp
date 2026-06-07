# P0 Go-Live Decision

Date: 2026-06-07

## Current Decision
- Go live now: `No`
- Reason: launch-safe code is stronger, but live evidence is still incomplete for critical flows and trust operations.

## Strengths
- Server-side route guards are live
- Org and admin boundaries have been hardened
- Approval lifecycle is server-backed
- HR and Accounting locked-detail leak is fixed in code
- AI deterministic command layer exists
- Pricing and Marketing are now more honest about what is live

## Remaining Blockers
- AI command validation on live Render
- Invite flow validation
- Approval flow validation after refresh
- CRM persistence validation
- Provider-backed feature validation
- Backup evidence
- Restore drill evidence
- Fake-data review evidence

## Decision Rule
- Move to go-live only when critical flows are both fixed in code and evidenced live.
