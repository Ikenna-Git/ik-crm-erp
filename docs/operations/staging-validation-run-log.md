# Civis Staging Validation Run Log

Updated: 2026-05-07

Use this as the live execution log while validating `p0-staging-validation-handoff` in staging.

Status values:

- `Not started`
- `Passed`
- `Failed`
- `Blocked`

Fill in:

- `Owner`
- `Date`
- `Evidence / note`

## Branch and release candidate

- Branch: `p0-staging-validation-handoff`
- Intended use: staging validation only
- Merge to `main`: `Not approved`
- Production deploy: `Not approved`

## 1. Staging environment and database

### 1.1 Staging environment created from `p0-staging-validation-handoff`
- Status:
- Owner:
- Date:
- Evidence / note:

### 1.2 Staging database configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 1.3 Prisma migrations applied
- Status:
- Owner:
- Date:
- Evidence / note:

### 1.4 Production-like env vars configured
- Status:
- Owner:
- Date:
- Evidence / note:

## 2. Shared rate limiting and observability

### 2.1 Upstash/Redis configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 2.2 Observability configured
- Status:
- Owner:
- Date:
- Evidence / note:

## 3. Core integrations

### 3.1 SMTP configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 3.2 Cloudinary configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 3.3 AI keys configured or AI disabled
- Status:
- Owner:
- Date:
- Evidence / note:

## 4. Stripe staging setup

### 4.1 Stripe test keys configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 4.2 Stripe price IDs configured
- Status:
- Owner:
- Date:
- Evidence / note:

### 4.3 Stripe webhook registered
- Status:
- Owner:
- Date:
- Evidence / note:

## 5. Data safety validation

### 5.1 Fake-data review run in report-only mode
- Status:
- Owner:
- Date:
- Evidence / note:

### 5.2 Backup completed
- Status:
- Owner:
- Date:
- Evidence / note:

### 5.3 Restore drill completed
- Status:
- Owner:
- Date:
- Evidence / note:

## 6. Smoke tests

### 6.1 Production smoke tests completed
- Status:
- Owner:
- Date:
- Evidence / note:

## 7. Release risk review

### 7.1 Remaining moderate vulnerabilities reviewed
- Status:
- Owner:
- Date:
- Evidence / note:

## 8. Final decision

### 8.1 Final merge decision
- Status:
- Owner:
- Date:
- Evidence / note:

### 8.2 Final deploy decision
- Status:
- Owner:
- Date:
- Evidence / note:

## Reference documents

- [staging-validation-task-list.md](/Users/mac/Documents/code/docs/operations/staging-validation-task-list.md)
- [go-live-decision.md](/Users/mac/Documents/code/docs/operations/go-live-decision.md)
- [production-smoke-tests.md](/Users/mac/Documents/code/docs/operations/production-smoke-tests.md)
- [stripe-staging-validation.md](/Users/mac/Documents/code/docs/billing/stripe-staging-validation.md)
- [rate-limit-production-setup.md](/Users/mac/Documents/code/docs/operations/rate-limit-production-setup.md)
- [observability-production-setup.md](/Users/mac/Documents/code/docs/operations/observability-production-setup.md)
- [fake-data-review.md](/Users/mac/Documents/code/docs/operations/fake-data-review.md)
- [backup-restore.md](/Users/mac/Documents/code/docs/operations/backup-restore.md)
- [.env.production.example](/Users/mac/Documents/code/.env.production.example)
