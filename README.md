# Ikenna CRM & ERP

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

Create `.env`:
```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# For email exports (optional but recommended)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Ikenna Reports <no-reply@yourdomain.com>"
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
- CRM: contacts, companies, deals (pipeline), tasks
- Accounting: invoices, expenses, CSV/email exports
- Settings: org profile and users
- Dark/light toggle; marketing site with pricing preview
- Variants stored for previous brand versions

## Notes
- Data now intended for Postgres; in-memory legacy store has been replaced in API routes.
- Email exports require SMTP envs; otherwise use desktop CSV download.
- Auth is demo-only; role enforcement and real OAuth are not yet wired.

## Scripts
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run lint` — lint
