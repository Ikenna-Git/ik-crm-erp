# P0 Next Action Checklist

## 1. Live Validation Required Now

- [ ] Run `BASE_URL=https://your-render-url npm run p0:smoke`
- [ ] Run the browser checks in `docs/operations/p0-screen-check-runbook.md`
- [ ] Confirm founder vs org owner admin boundaries on live Render
- [ ] Confirm invite flow lands new users in invite org only
- [ ] Confirm invoice approval lifecycle persists after refresh
- [ ] Confirm expense approval lifecycle persists after refresh
- [ ] Confirm CRM contact/company/deal CRUD survives refresh
- [ ] Confirm workflows remain org-scoped
- [ ] Confirm notifications persist through DB-backed flow

## 2. Environment Validation

- [ ] Verify `DATABASE_URL`
- [ ] Verify `NEXTAUTH_URL`
- [ ] Verify `NEXTAUTH_SECRET`
- [ ] Verify `PUBLIC_APP_URL`
- [ ] Verify `NEXT_PUBLIC_APP_URL`
- [ ] Confirm dev/demo flags are false in staging/production
- [ ] Validate Upstash live behavior or mark blocked
- [ ] Validate SMTP live behavior or mark blocked
- [ ] Validate Cloudinary live behavior or mark blocked
- [ ] Validate observability webhook/Sentry setup or mark blocked

## 3. Payments / Billing Validation

- [ ] Confirm missing Stripe config fails safely
- [ ] If Stripe test env is configured, run checkout validation
- [ ] If Stripe test env is configured, run webhook validation
- [ ] Keep payments marked non-live until checkout, webhook, and lifecycle are proven

## 4. Backup / Restore Validation

- [ ] Perform backup
- [ ] Perform restore drill
- [ ] Record evidence in the go-live evidence pack

## 5. Fake-Data Review

- [ ] Run fake-data review against a reachable DB clone
- [ ] Record findings and cleanup actions

## 6. Known Non-Blocking Tooling Debt

- [ ] Fix `eslint` availability on `main`
- [ ] Clean up repo-wide TypeScript / `.next/types` config debt in a separate pass
- [ ] Add a browser automation tool later if the team wants true E2E coverage

## 7. Go-Live Decision

- [ ] Fill `docs/operations/p0-go-live-evidence.md`
- [ ] Fill `docs/operations/p0-live-validation-log.md`
- [ ] Decide merge recommendation: `YES / NO`
- [ ] Decide deploy recommendation: `YES / NO`
