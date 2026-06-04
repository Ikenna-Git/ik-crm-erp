# Civis System Architecture (Security View)

This diagram and notes are generated from the current codebase (`app/api/*`, `lib/*`, `prisma/*`) as of 2026-05-02.

## 1) High-Level Architecture

```mermaid
flowchart LR
  subgraph Users[Client Layer]
    A1[Web Browser\nAdmin/User/Client]
    A2[NextAuth Session Cookies]
  end

  subgraph App[Render Web Service - Next.js App Router]
    B1[UI Pages\n/dashboard, /login, /portal/{code}]
    B2[API Routes\n/api/*]
    B3[Civis AI Orchestrator\n/api/ai/chat]
    B4[RBAC + Request Identity\nlib/auth.ts, lib/request-user.ts]
    B5[Audit Logging\nlib/audit.ts]
    B6[Rate Limiting\nlib/rate-limit.ts]
  end

  subgraph Data[Data Layer]
    C1[(Postgres\nPrisma Models)]
    C2[(AuditLog Table)]
    C3[(UserSettings / Notifications)]
  end

  subgraph External[External Services]
    D1[OpenAI / Anthropic / Gemini]
    D2[SMTP Provider]
    D3[Cloudinary]
  end

  A1 -->|HTTPS| B1
  B1 -->|fetch /api/*| B2
  A2 -->|Session| B4

  B2 --> B4
  B2 --> B6
  B2 --> B5
  B2 -->|Prisma| C1
  C1 --> C2
  C1 --> C3

  B3 --> D1
  B2 -->|Email notifications/digest| D2
  B2 -->|Media upload| D3
```

## 2) Trust Boundaries

1. Public Internet -> Render service
- All browser-origin traffic.
- Must enforce authN/authZ, CSRF controls (where applicable), and rate limits.

2. App server -> Postgres
- Contains PII/business-critical data (HR, CRM, accounting, audit).
- Must enforce least privilege, encrypted transit, and backup/restore controls.

3. App server -> Third-party providers
- AI providers, SMTP, Cloudinary.
- Requires secret management, outbound allowlisting, and key rotation.

4. Public portal access code boundary
- `/api/portal/{code}` and approvals route are tokenized public endpoints.
- Must rate-limit and monitor brute-force attempts.

## 3) Sensitive Data Map

- PII: `User`, `Employee`, `Contact`, `ClientPortal.contactEmail/contactName`
- Financial: `Invoice`, `Expense`, deal values, report exports
- Security/audit: `AuditLog`, role changes, webhook secrets
- Secrets in env: `NEXTAUTH_SECRET`, DB URL, SMTP creds, Cloudinary creds, AI keys

## 4) Security-Critical Flows

1. Authentication & session
- NextAuth credentials/google sign-in
- Session used by dashboard APIs

2. Business data CRUD
- CRM/accounting/HR/ops routes through Prisma

3. Public portal review
- Access via share code; optional approval posting via same code

4. AI copilot
- User prompt -> model provider -> response + optional live DB query

5. Notification & reporting
- Email dispatch through SMTP and exports through CSV/email paths

## 5) Immediate Architecture Risks (current residuals)

- Central route protection now exists through `proxy.ts`, and the previously exposed business endpoints are no longer intentionally public.
- Header/default identity fallback has been quarantined behind explicit local-development flags, but the codebase still carries those dev-only branches and they must not be enabled outside local development.
- Public portal code routes remain intentionally public, with in-memory rate limiting as a baseline. That is safer than before, but still not sufficient for multi-instance production; a shared store limiter is still required.
- The platform still relies on route/helper enforcement rather than a fully uniform action-policy engine for every business operation.
- Payment and subscription lifecycle handling is not implemented yet; billing is metadata/admin-settings only.
