# Civis Phase Plan

Updated: 2026-04-25

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

## Immediate Recommended Order

1. database connectivity
2. migration apply
3. HR validation
4. Projects validation
5. Inventory validation
6. commit and push local backend work
7. Render deploy
8. production integration setup
9. AI polish and security backlog

