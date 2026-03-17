# Civis Project Dossier

Snapshot date: 2026-03-17

This document summarizes what has been built in the `ik-crm-erp` repository, what is already on `main`, and what is currently in local progress but not yet committed.

## 1. Product Summary

Civis is a full-stack CRM/ERP platform built on Next.js App Router. It combines:

- CRM for contacts, companies, deals, follow-ups, and custom CRM fields
- Accounting for invoices, expenses, exports, and reports
- HR for employees, payroll, attendance, positions, and compliance views
- Projects for project boards, tasks, timeline tracking, and reporting
- Inventory for products, stock, purchase orders, and import flows
- Operations for command center, workflows, decision trails, and playbooks
- Client portal for document sharing, status updates, and approvals
- AI assistance for Q&A, summaries, guided navigation, and email drafting

The product includes both a marketing/public surface and an authenticated dashboard surface.

## 2. Current Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- NextAuth for authentication
- Nodemailer for email delivery
- Cloudinary for uploads
- OpenAI / Anthropic / Gemini provider support for Civis AI

The current production build script uses webpack:

```json
"build": "prisma generate && next build --webpack"
```

This was chosen because local Turbopack builds were unstable for this repo.

## 3. Application Surface

### Public pages

- `/`
- `/features`
- `/pricing`
- `/terms`
- `/login`
- `/signup`
- `/portal/[code]`

### Dashboard pages

- `/dashboard`
- `/dashboard/accounting`
- `/dashboard/ai`
- `/dashboard/analytics`
- `/dashboard/crm`
- `/dashboard/demo`
- `/dashboard/docs`
- `/dashboard/docs/api`
- `/dashboard/gallery`
- `/dashboard/hr`
- `/dashboard/inventory`
- `/dashboard/marketing`
- `/dashboard/operations`
- `/dashboard/playbooks`
- `/dashboard/portal`
- `/dashboard/profile`
- `/dashboard/projects`
- `/dashboard/settings`
- `/dashboard/settings/2fa`

### API groups currently present

- Auth
- CRM
- Accounting
- HR
- Projects
- Inventory
- Notifications
- AI
- Ops / workflows
- Playbooks
- Portal
- Reports
- Search
- Audit / decision trails
- OpenAPI docs
- Uploads / Cloudinary
- Settings / user settings
- Admin users
- Health checks

## 4. What Has Been Built

### 4.1 Authentication and access

- NextAuth credentials login
- Google OAuth support
- 2FA setup, verify, verify-login, and disable routes
- Session-backed dashboard access
- role model in Prisma (`SUPER_ADMIN`, `ADMIN`, `USER`)

### 4.2 CRM

- Contacts CRUD
- Companies CRUD
- Deals CRUD
- Follow-up generation endpoint
- Custom CRM fields with types:
  - text
  - number
  - currency
  - date
  - select
  - multiselect
  - checkbox
- CRM reports and dashboard views

### 4.3 Accounting

- Invoice CRUD
- Expense CRUD
- Report exports
- Digest/reporting endpoints
- Finance summaries used by dashboard and AI

### 4.4 HR

The HR module now has a real server/data layer in local work:

- employees
- payroll records
- attendance records
- positions

The page and supporting components have been rewritten to call `/api/hr/*` instead of living entirely on mock data.

### 4.5 Projects

The projects module now has a real server/data layer in local work:

- projects
- project tasks
- project board
- kanban task flow
- timeline view

The page has been rewired to `/api/projects` and `/api/projects/tasks`.

### 4.6 Inventory

The inventory module now has a real server/data layer in local work:

- products
- stock
- purchase orders
- CSV-style import handling on the UI side

The page has been rewired to `/api/inventory/*`.

### 4.7 Operations and automation

- Ops command center
- automation workflows
- playbooks
- decision trails
- rollback endpoints
- audit logging
- webhook endpoints

### 4.8 Client portal and document sharing

- client portals
- portal updates
- portal documents
- portal approvals
- share-code based client access

### 4.9 AI features

- `/api/ai/chat`
- `/api/ai/conversations`
- provider routing for OpenAI / Anthropic / Gemini
- fallback behavior when provider or DB is unavailable
- AI page in dashboard
- global AI assist popover / coach
- AI guided navigation actions
- email drafting
- business summaries
- live data prompts for CRM / accounting / HR / operations

### 4.10 Documentation and security work

- in-app API docs page at `/dashboard/docs/api`
- OpenAPI route at `/api/openapi`
- security architecture doc
- endpoint inventory doc
- NDPA / VAPT hardening plan
- OpenAPI YAML for Swagger/SwaggerHub import

## 5. Data Model Overview

The Prisma schema currently models:

- `Org`
- `User`, `Account`, `Session`, `VerificationToken`
- `UserSettings`
- `Contact`, `Company`, `Deal`, `CrmField`, `Task`
- `Invoice`, `Expense`
- `Position`, `Employee`, `PayrollRecord`, `AttendanceRecord`
- `Project`, `ProjectTask`
- `InventoryProduct`, `InventoryStock`, `PurchaseOrder`
- `GalleryItem`, `Doc`
- `Notification`
- `AuditLog`
- `DecisionTrail`
- `PlaybookRun`
- `ClientPortal`, `ClientPortalUpdate`, `ClientPortalDocument`
- `AutomationWorkflow`
- `WebhookEndpoint`

This means Civis is no longer just a UI prototype. It already has a substantial relational backend model.

## 6. Environment and Integration Requirements

Current `.env.example` expects these main groups:

- Database:
  - `DATABASE_URL`
- Auth:
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Email:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- Cloudinary:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- AI:
  - `AI_PROVIDER`
  - `AI_MODEL`
  - `AI_MODEL_OPENAI`
  - `AI_MODEL_ANTHROPIC`
  - `AI_MODEL_GEMINI`
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `GEMINI_API_KEY`
- Payments:
  - `PAYSTACK_PUBLIC_KEY`
  - `PAYSTACK_SECRET_KEY`
  - `PAYSTACK_WEBHOOK_SECRET`

## 7. Recent Milestones from Git History

Recent committed milestones on `main` include:

- `ecca0a6` Add local Swagger docs page and REST-style API aliases
- `c5870a7` Harden API auth surface and add security architecture/OpenAPI docs
- `be03fe1` Stabilize Civis Coach: cap chat payload and handle resolver failures
- `12b0f49` Remove rigid option flow and enable model-first free conversation
- `4821369` Shift Civis AI to model-first conversation
- `f42de98` Make Civis AI less robotic and improve email drafting/global popup coach
- `07efb5d` Improve Civis AI conversational behavior and provider model routing
- `642371c` Improve AI assistant flow, dev fallbacks, and dashboard resiliency
- `41515b4` Add AI concierge, portal approvals, CRM fields, and RBAC
- `8a2447e` Add onboarding checklist, digest settings, portal updates, and webhooks

These commits show the project moved from dashboard UI work into:

- real AI orchestration
- security hardening
- portal workflows
- API documentation
- RBAC and settings work

## 8. Current Local Work In Progress

The current local worktree is not clean. In addition to committed `main`, there is local in-progress work for:

- HR backend conversion
- Projects backend conversion
- Inventory backend conversion
- 2FA-related pages and routes
- Search endpoint and unified search work
- PWA-related files
- notification center / settings work
- app layout and provider updates
- auth and request-user helper changes

There is also a pending Prisma migration:

- `prisma/migrations/20260313183000_add_hr_projects_inventory_backend/`

This migration still needs to be applied to the target database before the new HR/Projects/Inventory backend work can run end to end.

## 9. Current Risks / Gaps

- The local repo contains uncommitted work, so not all described features are necessarily deployed on Render yet.
- The active database connection used for local Prisma migration has recently failed with `P1001`, which means DB connectivity must be corrected before more schema changes are applied.
- Some integrations remain optional or partially configured in practice:
  - Google OAuth
  - SMTP delivery
  - Cloudinary uploads
  - AI provider keys
  - Paystack
- AI behavior has improved a lot, but it still needs continued tuning to feel consistently natural in production.

## 10. Recommended Documentation Structure Going Forward

To avoid losing track again, keep these docs updated:

- `README.md`
  - quick start and deployment basics
- `docs/project-dossier.md`
  - business/product snapshot
- `docs/security/system-architecture.md`
  - architecture and trust boundaries
- `docs/security/endpoint-inventory.md`
  - API inventory
- `docs/security/ndpa-vapt-hardening-plan.md`
  - security roadmap
- `docs/security/openapi.yaml`
  - API contract for Swagger

## 11. Practical Summary

What you have is not just a landing page or mock dashboard. Civis is already a serious full-stack product foundation with:

- multi-module business operations
- PostgreSQL data model
- auth and role system
- AI layer
- client portal
- reporting/export surface
- API documentation
- security documentation

The main thing that now matters is operational discipline:

- keep docs current
- keep database connectivity stable
- finish applying migrations
- separate committed production-ready work from local experiments

