# Civis CRM & ERP

Modern Next.js 16 app for multi-workspace CRM, ERP, client portal, and admin operations.

## Tech Stack
- Next.js 16 (App Router) + React 19
- TailwindCSS + custom UI components
- Prisma ORM with PostgreSQL
- API routes for CRM, tasks, accounting, settings, reports, admin, portal, and AI
- Nodemailer for report email exports (SMTP required)

## Quick Start
```bash
git clone https://github.com/Ikenna-Git/ik-crm-erp.git
cd ik-crm-erp
npm install
```

Create `.env.local` (recommended) or `.env`:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# For email exports + notifications (optional but recommended)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Civis Reports <no-reply@yourdomain.com>"

# NextAuth (required for login)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_with_a_long_random_secret"
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Shared rate limiting (required for serious multi-instance production)
RATE_LIMIT_STORE="upstash"
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Observability / alerting (optional locally, recommended in production)
OBSERVABILITY_WEBHOOK_URL=
SECURITY_EVENTS_WEBHOOK_URL=
ERROR_ALERT_WEBHOOK_URL=
SENTRY_DSN=

# Cloudinary (docs/gallery uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional local-development flags only
ALLOW_DEV_HEADER_IDENTITY="false"
ALLOW_DEV_DEFAULT_IDENTITY="false"
NEXTAUTH_ALLOW_DEV_FALLBACK="false"
NEXT_PUBLIC_ENABLE_DEMO_MODE="false"
```

Initialize Prisma and DB:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

Run dev server:
```bash
npm run dev
```

Open `http://localhost:3000`.

## Features (current)
- Multi-workspace admin control plane with `SUPER_ADMIN`, `ORG_OWNER`, `ADMIN`, and `USER`
- Ops command center with decision feed + audit/decision trails
- CRM: contacts, companies, deals, activities, CRM reports
- Accounting: invoices, expenses, financial reports, CSV/email exports
- Playbooks with AI suggestions and run history
- Client portal with shareable access codes
- Settings: profile/preferences, notifications, team roles
- HR, projects, and inventory modules backed by Postgres routes
- Marketing site with pricing preview and public portal access

## Notes
- Production and staging require a real database, real auth sessions, and real workspace membership. Demo or fallback identity/data paths are explicitly quarantined to local development flags only.
- Authenticated users without workspace membership are redirected to `/workspace-required`. Civis does not auto-create default/demo workspaces in production.
- Email exports + notifications require SMTP envs; otherwise use desktop CSV download.
- OAuth providers are optional; credentials login works with JWT sessions.
- Founder-only `SUPER_ADMIN` is currently enforced in `lib/authz.ts` for `ikchils@gmail.com`. Treat that as a platform ownership control, not as a normal admin role.
- Shared rate limiting must use a real store in production. In-memory limits are only acceptable for local development.
- Pricing is public marketing UI. Billing metadata, admin billing settings, and partial plan gating exist, but live subscription checkout/webhook automation is not implemented yet.
- Structured observability hooks exist for auth failures, admin denials, exports, uploads, rollback, and portal abuse attempts. External delivery requires the observability webhook envs above.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — TypeScript no-emit check
- `npm run typecheck` — TypeScript no-emit check
- `npm run audit:deps` — dependency audit
- `npm run fake-data:review -- --org <orgId> --report-only --out /tmp/fake-data-report.json` — safe fake/demo data review for a single org
- `npm run fake-data:review -- --org <orgId> --delete --confirm-delete DELETE_DEMO_DATA` — destructive cleanup for confirmed demo data only

## Documentation
- Project dossier: `docs/project-dossier.md`
- Product overview: `docs/product-overview.md`
- Technical handoff: `docs/technical-handoff.md`
- Security architecture: `docs/security/system-architecture.md`
- Endpoint inventory: `docs/security/endpoint-inventory.md`
- NDPA/VAPT hardening plan: `docs/security/ndpa-vapt-hardening-plan.md`
- RBAC matrix: `docs/security/rbac-matrix.md`
- Backup/restore operations: `docs/operations/backup-restore.md`
- Payment readiness plan: `docs/billing/payment-readiness-plan.md`
- OpenAPI spec: `docs/security/openapi.yaml`
