# Civis Technical Handoff

Updated: 2026-03-17

This document is for engineers continuing work on the Civis codebase.

## 1. Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Prisma 6
- PostgreSQL
- NextAuth 4
- Nodemailer
- Cloudinary

## 2. Build / Runtime Notes

Current `package.json` build script:

```json
"build": "prisma generate && next build --webpack"
```

Reason:
- Turbopack caused unstable local production build failures in this repo.
- Webpack path is currently the stable build path.

## 3. Authentication Model

Auth is handled with NextAuth and credentials/google providers.

Key files:

- [auth.ts](/Users/mac/Documents/code/lib/auth.ts)
- [route.ts](/Users/mac/Documents/code/app/api/auth/[...nextauth]/route.ts)
- [page.tsx](/Users/mac/Documents/code/app/(auth)/login/page.tsx)
- [route.ts](/Users/mac/Documents/code/app/api/auth/login/check/route.ts)
- [route.ts](/Users/mac/Documents/code/app/api/auth/2fa/setup/route.ts)
- [route.ts](/Users/mac/Documents/code/app/api/auth/2fa/verify/route.ts)
- [route.ts](/Users/mac/Documents/code/app/api/auth/2fa/verify-login/route.ts)
- [route.ts](/Users/mac/Documents/code/app/api/auth/2fa/disable/route.ts)

Current state:

- credentials auth exists
- Google auth support exists
- 2FA routes exist
- session-backed dashboard gating exists

## 4. Data Layer

Prisma schema location:

- [schema.prisma](/Users/mac/Documents/code/prisma/schema.prisma)

High-level model groups:

- org/user/session/auth
- CRM
- accounting
- HR
- projects
- inventory
- portal/docs/gallery
- notifications/audit/decision trails
- playbooks/workflows/webhooks
- settings

## 5. API Surface

Main API folders:

- `app/api/auth`
- `app/api/crm`
- `app/api/accounting`
- `app/api/hr`
- `app/api/projects`
- `app/api/inventory`
- `app/api/portal`
- `app/api/ops`
- `app/api/playbooks`
- `app/api/reports`
- `app/api/notifications`
- `app/api/settings`
- `app/api/search`
- `app/api/uploads`
- `app/api/ai`

OpenAPI route:

- [route.ts](/Users/mac/Documents/code/app/api/openapi/route.ts)

Security/API references:

- [endpoint-inventory.md](/Users/mac/Documents/code/docs/security/endpoint-inventory.md)
- [openapi.yaml](/Users/mac/Documents/code/docs/security/openapi.yaml)

## 6. Dashboard Pages

Main dashboard pages live under:

- `app/(dashboard)/dashboard/*`

Important pages:

- dashboard overview
- CRM
- accounting
- HR
- inventory
- projects
- operations
- playbooks
- portal
- docs/API docs
- settings
- AI

## 7. AI System

Main AI route:

- [route.ts](/Users/mac/Documents/code/app/api/ai/chat/route.ts)

Supporting areas:

- provider routing
- fallback response logic
- knowledge lookup
- page coach / popover UI

AI capabilities currently include:

- conversational Q&A
- summary mode
- email mode
- tour/guide mode
- navigation actions
- some live data responses via Prisma

Known reality:

- AI behavior is materially improved from earlier menu-driven behavior
- it still needs continued tuning to feel consistently natural in production

## 8. Security / Documentation

Existing security docs:

- [system-architecture.md](/Users/mac/Documents/code/docs/security/system-architecture.md)
- [endpoint-inventory.md](/Users/mac/Documents/code/docs/security/endpoint-inventory.md)
- [ndpa-vapt-hardening-plan.md](/Users/mac/Documents/code/docs/security/ndpa-vapt-hardening-plan.md)
- [openapi.yaml](/Users/mac/Documents/code/docs/security/openapi.yaml)

These were generated from the current codebase and should be maintained as architecture changes.

## 9. Environment Variables

Current `.env.example` covers:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- SMTP values
- Cloudinary values
- AI provider values
- Paystack values
- dev-only auth fallbacks

Important practical note:

- Prisma commands have been reading from `.env`
- some runtime behavior also uses `.env.local`
- local database confusion has happened before because the wrong file was updated

## 10. Current Local Worktree State

There is active uncommitted work in the repo beyond `main`.

The important local-progress areas are:

- HR backend conversion
- Projects backend conversion
- Inventory backend conversion
- search work
- 2FA/settings work
- PWA work
- app layout/provider adjustments

That means:

- the repo state on disk is ahead of the last pushed production commit
- not every current local file is necessarily live on Render

## 11. HR / Projects / Inventory Backend Conversion

These modules have recently been converted from UI-local/mock-style behavior toward real API-backed flows.

Added route groups:

- `app/api/hr/*`
- `app/api/projects/*`
- `app/api/inventory/*`

Supporting seed helper:

- [module-seeds.ts](/Users/mac/Documents/code/lib/module-seeds.ts)

Important migration:

- [migration.sql](/Users/mac/Documents/code/prisma/migrations/20260313183000_add_hr_projects_inventory_backend/migration.sql)

Current dependency:

- this migration still needs to be applied to the active database before the new data model works end to end

## 12. Known Operational Issues

### Database connectivity

Recent local Prisma migration attempts failed with:

- `P1001` cannot reach database

Meaning:

- database host/credentials/availability must be corrected before continuing migration-heavy work

### Build/tooling

Previously fixed:

- missing Prisma client typings after reinstall
- unstable Turbopack build path
- remote font dependency in root layout

Current result:

- local production build succeeds via webpack path

## 13. Recommended Next Engineering Priorities

1. stabilize active database connection
2. apply pending HR/Projects/Inventory migration
3. finish converting remaining partially mock-driven views
4. continue AI quality improvements
5. clean the worktree and separate production-ready changes from experiments
6. maintain docs as part of normal commits

## 14. Suggested Handoff Discipline

When handing this repo to another engineer, provide:

- current branch and latest deployed commit
- whether local worktree differs from deployed state
- active DB provider and connection target
- which env file is the source of truth
- whether migrations have been applied
- whether Render and local are in sync

