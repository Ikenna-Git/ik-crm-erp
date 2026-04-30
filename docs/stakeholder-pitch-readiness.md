# Civis Stakeholder Pitch Readiness

Updated: 2026-04-30

This document is the practical gate for deciding when Civis is ready to be shown to serious stakeholders with their own admin access.

It is intentionally stricter than a feature list.

## Current Truth

Civis is no longer just a demo shell. It now has:

- a real dashboard product structure
- CRM, accounting, operations, client portal, and AI surfaces
- a growing backend/API layer
- a live admin control-plane foundation
- security architecture and API documentation

But it is not yet fully stakeholder-ready across platform governance, operational reliability, commercial controls, and supportability.

That means the correct question is not:

- “Does it have features?”

The correct question is:

- “Can a stakeholder trust this platform with users, data, access control, and day-two operations?”

## Gate 1: Must-Have Before Stakeholder Admin Access

These are the minimum conditions before giving a stakeholder their own admin login and expecting them to use the product seriously.

### Platform Control

- Founder remains the only permanent `SUPER_ADMIN`
- stakeholder admins are restricted to their own workspace
- admin pages are live on the deployed environment
- admin user management works on the deployed environment
- workspace settings and audit visibility work on the deployed environment

### Data and Backend

- active database connection is stable
- pending schema migrations are applied successfully
- core module data persists correctly against the live database
- admin and auth routes behave correctly in production

### Security Baseline

- production auth secrets are correct
- session behavior is stable
- role boundaries are enforced in real routes, not only UI
- audit logs capture admin-critical actions

### Product Stability

- local and production build are green
- the routes used in demos do not depend on mock-only state
- critical pages do not throw runtime errors

If any of the above are not true, stakeholder admin access should be treated as premature.

## Gate 2: Strongly Recommended Before a Paid Pilot

These are the next layer. The product can be pitched without every single item here, but a serious pilot becomes risky if too many are missing.

### Identity and User Access

- invite acceptance flow for seeded users
- stable Google OAuth or a clearly supported credentials flow
- full 2FA validation against the live database
- action-level RBAC matrix for sensitive workflows

### Production Integrations

- SMTP is configured and tested
- Cloudinary or equivalent upload storage is configured and tested
- AI provider keys are live and validated

### Reliability and Recovery

- error tracking is configured
- uptime and health monitoring are configured
- a backup and restore plan exists and has been tested
- incident response ownership is documented

### Governance

- NDPA/VAPT backlog has started in implementation, not only documentation
- retention and deletion approach is defined
- high-risk actions are visible in audit history

## Gate 3: Pitch-Ready But Can Follow Immediately After

These items improve credibility and customer success, but they do not all need to block the first strong stakeholder pitch if Gate 1 is genuinely satisfied.

- CSV importers for CRM/HR/inventory/accounting
- export center for operational and compliance workflows
- soft delete and record recovery
- in-product help center
- support impersonation with audit trail
- customer health and usage analytics
- billing and seat visibility for admins
- plan-aware feature gating

## Gate 4: Later-Stage Platform Work

These are real platform requirements, but they are not the first blockers for early stakeholder demos or controlled pilots.

- white-label branding controls
- advanced commercial lifecycle automation
- detailed subscription self-service
- sophisticated approval center for sensitive actions
- broad localization/i18n
- deeper enterprise governance workflows
- landing page and marketing-site redesign

## Scorecard

Use this quick score before any stakeholder access decision:

### Hard stop if any of these are “No”

- Is the database stable and reachable?
- Are the current migrations applied?
- Is the admin control plane live on the target environment?
- Are role boundaries enforced server-side?
- Can you safely create and manage stakeholder users?
- Can you recover from a bad deploy or data issue?

### Green-light indicators

- core stakeholder flows work in both local and deployed environments
- errors are monitored
- auth is stable
- admin boundaries are clear
- no critical page in the demo path is using fake-only state

## Recommendation

For Civis right now, the next correct sequence is:

1. stabilize the database connection
2. apply migrations
3. validate the admin control plane on live data
4. validate HR, projects, and inventory on live data
5. deploy a clean batch
6. add monitoring/recovery basics
7. complete the first stakeholder pitch gate review

This document should be treated as a release gate, not just as notes.
