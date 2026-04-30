# Civis Phase Plan

Updated: 2026-04-30

This plan translates the current repository state into a clean execution order.

## Phase 0: Foundation and Project Control

Status: mostly done

Completed:

- app structure exists
- Prisma/Postgres model exists
- core docs exist
- build path stabilized on webpack

Remaining:

- keep documentation updated per feature batch
- reduce the gap between local worktree and deployed `main`

## Phase 1: Authentication and Access

Status: partially complete

Completed:

- credentials login
- Google auth support path
- role model
- 2FA route surface

Remaining:

- validate 2FA end to end against the live database
- finish production Google OAuth credentials
- continue auth hardening cleanup in local worktree

## Phase 1B: Admin Control Plane

Status: local in-progress

Completed locally:

- separate `/admin` control-plane shell built
- live admin overview route built
- workspace admin pages for users, workspace settings, and security built
- founder-locked super-admin policy enforced in admin role management
- super-admin workspace provisioning route built for stakeholder onboarding

Remaining:

- validate admin pages against live database
- commit and push the admin batch
- redeploy Render with the control plane
- connect admin invite flows to production email later if needed
- expand from current org model into fuller multi-workspace lifecycle management over time

## Phase 2: CRM

Status: functionally present

Completed:

- contacts, companies, deals
- custom CRM fields
- follow-ups
- reports/views

Remaining:

- improve field editor UX
- keep CRM reporting and AI usage accurate under live data

## Phase 3: Accounting

Status: functionally present

Completed:

- invoices
- expenses
- exports
- summaries

Remaining:

- connect SMTP for real email delivery
- continue live-data validation of reports/exports

## Phase 4: Operations and Governance

Status: functionally present

Completed:

- ops command center
- workflows
- playbooks
- decision trails
- rollback routes
- audit logging
- webhooks

Remaining:

- expand automation coverage
- continue hardening security and webhook controls

## Phase 5: Client Portal

Status: functionally present

Completed:

- portals
- updates
- documents
- approvals

Remaining:

- finish production-grade upload flow with Cloudinary
- continue validation of portal approval/doc flows

## Phase 6: AI Layer

Status: materially implemented, still evolving

Completed:

- AI chat route
- conversation route
- provider routing
- global coach/popover
- guided navigation
- summaries
- email drafting
- model-first conversation flow

Remaining:

- continue reducing robotic responses
- improve page-aware guidance and action depth
- validate live provider setup and production behavior

## Phase 7: Security and API Documentation

Status: documentation completed, implementation ongoing

Completed:

- security architecture doc
- endpoint inventory
- NDPA/VAPT plan
- OpenAPI spec
- in-app API docs

Remaining:

- execute the hardening backlog
- keep spec/docs synchronized with route changes

## Phase 8: HR, Projects, and Inventory Backend Conversion

Status: local in-progress

Completed locally:

- HR API routes
- Projects API routes
- Inventory API routes
- UI rewires toward live APIs
- seed helper
- org-scoped mutation protections

Remaining:

- fix/confirm database connectivity
- apply pending Prisma migration
- validate each module against a live DB
- commit and push the backend conversion batch

## Phase 9: Infrastructure and Deployment

Status: blocked by DB / release discipline

Remaining:

1. fix active `DATABASE_URL`
2. apply pending Prisma migration
3. run local validation on:
   - `/dashboard/hr`
   - `/dashboard/projects`
   - `/dashboard/inventory`
4. commit the current backend conversion work in a clean batch
5. push to `main`
6. redeploy on Render

## Phase 10: Production Integrations

Status: code paths exist, env setup still incomplete

Remaining:

- Google OAuth production credentials
- SMTP
- Cloudinary
- live AI provider keys
- Paystack if required

## Phase 11: Ongoing Discipline

This is the part that matters most now.

The platform is no longer just “building features.” The next stage is disciplined shipping:

- keep batches smaller
- keep docs current
- separate local experiments from deploy-ready code
- finish one backend conversion cycle fully before starting the next

## Phase 12: Tenant and Workspace Lifecycle

Status: newly tracked, mostly pending

Completed locally:

- founder-locked super-admin policy
- initial stakeholder workspace provisioning route
- workspace-scoped admin UI foundation

Remaining:

- invite acceptance flow for seeded users
- fuller multi-workspace membership model
- workspace switching for founders/support users
- workspace suspension, archive, and restore controls
- org-level feature flags and lifecycle states
- action-level permission matrix beyond page access

## Phase 13: Billing, Entitlements, and Commercial Controls

Status: pending

Remaining:

- seat and entitlement model
- plan-aware feature gating
- billing dashboard for workspace admins
- upgrade, downgrade, and trial lifecycle flows
- payment-backed subscription controls
- commercial readiness for stakeholder pilots

## Phase 14: Reliability, Observability, and Recovery

Status: pending

Remaining:

- production error tracking
- structured logs and alerting
- uptime and health monitoring
- background jobs/queue system for digests, webhooks, and async tasks
- backup and restore workflow
- tested incident response and recovery discipline

## Phase 15: Data Governance and Enterprise Readiness

Status: pending

Remaining:

- CSV importers for CRM, HR, inventory, and finance
- export center for admin and compliance workflows
- soft delete and recovery paths
- retention and purge controls
- NDPA/privacy request workflows
- approval center for sensitive actions
- white-label and enterprise branding controls

## Phase 16: Support, Customer Success, and Go-to-Market

Status: pending

Remaining:

- support/help center inside the product
- support-grade impersonation with audit trail
- customer usage and health views
- changelog and release communication
- accessibility and mobile QA sweep
- stakeholder pitch readiness gate with explicit launch criteria

## Stakeholder Pitch Gate

### Must-have before stakeholder admin access

- stable database and successful migration path
- real admin control plane live on deploy
- founder-locked super-admin policy live
- stakeholder admin user creation and role control live
- workspace settings and audit visibility live
- core module data persistence verified against live DB
- production auth secrets and session behavior stable

### Should be ready before a paid pilot

- invite acceptance flow
- Google OAuth or another stable sign-in path
- SMTP for admin/user notifications
- Cloudinary or equivalent upload storage
- error monitoring and alerting
- backup and restore discipline
- security hardening backlog started in implementation, not only documentation

### Important but can follow after initial pitch

- billing and entitlements
- CSV imports and export center
- support/help center
- white-label controls
- product usage analytics
- advanced enterprise governance workflows

## Immediate Recommended Order

1. database connectivity
2. migration apply
3. admin control-plane validation
4. stakeholder pitch gate review
5. HR validation
6. Projects validation
7. Inventory validation
8. commit and push local backend work
9. Render deploy
10. production integration setup
11. observability and recovery basics
12. AI polish and security backlog
