# Civis NDPA + VAPT Hardening Plan

This plan converts the NDPA + VAPT recommendations into execution phases for this codebase.

## Phase 0 (Immediate - 48 hours)

### A) Stop highest-risk exposure
- Protect currently public business endpoints with session auth:
  - `/api/tasks`
  - `/api/app/bootstrap`
  - `/api/reports/export`
  - `/api/uploads/cloudinary`
- Disable header-based user impersonation fallback outside local dev.
- Enforce strict role checks for admin/rollback/webhook-secret operations.

Status as of 2026-05-02:
- Implemented in code: centralized route protection via `proxy.ts`, private API authentication for the previously exposed business routes, stricter admin/rollback/webhook guards, and dev-only gating for fallback identity branches.
- Still open: distributed/shared rate limiting, stronger observability/alerting, and a full action-level authorization matrix across every module.

### B) Secrets and environment hygiene
- Rotate and re-issue all secrets after any accidental exposure:
  - `DATABASE_URL`, `NEXTAUTH_SECRET`, SMTP, Cloudinary, AI keys.
- Ensure `.env`, `.env.local` are gitignored and never committed.
- Separate dev/staging/prod environment values.

### C) Security headers baseline
- Add/verify headers in Next.js config or middleware:
  - `Strict-Transport-Security`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `X-Frame-Options` or CSP `frame-ancestors`
  - Content-Security-Policy (start in report-only if needed)

## Phase 1 (Week 1)

### 1) Security testing pipeline (CI)
- On every PR:
  - SAST: ESLint security rules + semgrep baseline
  - SCA: dependency vulnerability scan (`npm audit`, Dependabot)
  - Secret scan: gitleaks/trufflehog
  - IaC scan for deployment manifests (if applicable)
- On staging deploy:
  - DAST API smoke security checks (OWASP API Top 10 aligned)

### 2) Access control hardening
- Define authorization matrix: each endpoint + allowed roles/actions.
- Enforce role middleware/helper centrally; remove ad-hoc checks.
- Add session hardening:
  - idle timeout policy
  - explicit device/session revoke endpoint
  - login alerting for privileged accounts
- MFA roadmap for admins/super-admins.

### 3) Detection and response
- Centralize security logs:
  - failed auth, role changes, webhook edits, export actions, portal approval events
- Add suspicious behavior alerts:
  - repeated failed auth
  - portal code brute force
  - abnormal export volume
- Incident runbook:
  - owner, severity model, escalation path, communications template

## Phase 2 (Weeks 2-3)

### 4) NDPA compliance-by-design
- Data inventory + classification:
  - PII, financial, credentials, audit data
- Lawful basis mapping for each processing purpose.
- Retention/deletion policy and technical enforcement jobs.
- DSAR workflows:
  - data export, rectification, deletion requests
- Breach workflow meeting NDPA timing (72-hour notification readiness).
- Determine if DPO/major-importance registration applies.

### 5) Backup and recovery
- Encrypted backups verified for DB and critical objects.
- Monthly restore drill with documented evidence.
- Set and test RPO/RTO targets.

### 6) Third-party risk controls
- Least-privilege API keys for:
  - Cloudinary
  - SMTP
  - AI providers
  - payment providers
- Key rotation schedule + owner.
- Outbound allowlist where possible.

## Phase 3 (Quarterly Ongoing)

### 7) VAPT cadence
- External pentest before major releases.
- Internal authenticated pentest quarterly.
- Dedicated API pentest aligned to OWASP API Top 10 (2023).
- Track findings in remediation SLA:
  - Critical: 72h
  - High: 7 days
  - Medium: 30 days

### 8) Governance and assurance
- Adopt OWASP ASVS as build gate baseline.
- Use OWASP WSTG to structure test coverage.
- Quarterly security posture review with metrics:
  - open findings by severity
  - MTTR for vulnerabilities
  - % endpoints covered by authz tests
  - backup restore success rate

---

## Current Gaps Detected in This Repo

- Public portal endpoints remain intentionally public by access code and still need a distributed anti-enumeration/rate-limit store for serious production use.
- Dev-only fallback code paths still exist and must remain disabled outside local development.
- Security controls are materially stronger, but authorization is still not a single complete policy engine across every action in the platform.
- Billing/subscription lifecycle is still not implemented beyond metadata/admin settings.
- CI now has a baseline workflow, but deeper SAST/secret scanning is still missing.

## Recommended Next 3 Engineering Tasks

1. Replace the in-memory portal/auth/export/upload rate limiter with a shared store implementation.
2. Add production observability and incident alerting for auth, DB, AI, upload, and webhook failures.
3. Finish action-level RBAC and commercial gating for admin, billing, and sensitive module actions.
