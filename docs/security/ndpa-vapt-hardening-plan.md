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

- Public endpoints exposing business operations/data exist.
- Header-driven identity fallback can permit impersonation patterns if not tightly controlled.
- Security controls are implemented per-route, not yet centralized.
- No visible CI security workflow currently in `.github/workflows`.

## Recommended Next 3 Engineering Tasks

1. Implement centralized request identity + authorization guard and migrate all routes.
2. Add CI security workflow (SAST/SCA/secret scanning) and fail PRs on critical findings.
3. Add public endpoint protection + portal brute-force protection with per-IP and per-code limits.

