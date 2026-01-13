# Civis CRM & ERP

Modern Next.js 16 app with CRM, ERP, analytics, and premium dark theme.

## Tech Stack
- Next.js 16 (App Router) + React 19
- TailwindCSS + custom UI components
- Prisma ORM with PostgreSQL
- API routes for CRM, tasks, accounting, settings, reports
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

# Cloudinary (docs/gallery uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Admin defaults (demo fallback)
DEFAULT_SUPER_ADMIN_EMAIL="ikchils@gmail.com"
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
- Ops command center with decision feed + audit/decision trails
- CRM: contacts, companies, deals, activities, CRM reports
- Accounting: invoices, expenses, financial reports, CSV/email exports
- Playbooks with AI suggestions and run history
- Client portal with shareable access codes
- Settings: profile/preferences, notifications, team roles
- Dark/light toggle; marketing site with pricing preview

## Notes
- Data is Postgres-backed; demo fallbacks render if DB is missing.
- Email exports + notifications require SMTP envs; otherwise use desktop CSV download.
- OAuth providers are optional; credentials login works with JWT sessions.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint
