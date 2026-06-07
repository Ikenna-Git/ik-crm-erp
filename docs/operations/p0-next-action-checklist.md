# P0 Next Action Checklist

Branch focus: `p0-launch-ux-world-class-sweep`

## 1. Live Validation Required Now

- [x] Run `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke`
- [x] Confirm logged-out `/dashboard` no longer returns `200`
- [x] Confirm logged-out `/admin` no longer returns `200`
- [x] Confirm `/api/admin/orgs` still returns `401` when logged out
- [x] Confirm `/api/admin/platform-status` still returns `401` when logged out
- [ ] Confirm logged-out `/admin/system` is blocked
- [ ] Run the browser checks in `docs/operations/p0-screen-check-runbook.md`
- [ ] Re-test `ikenna.chilokwu@getpayedmail.com`
- [ ] Confirm founder vs org owner admin boundaries on live Render
- [ ] Confirm the invited account cannot access founder-only pages
- [ ] Confirm the invited account cannot see users outside its own org
- [ ] Confirm the invited account only has the role intended for that org
- [ ] Confirm invite flow lands new users in invite org only
- [ ] Confirm invoice approval lifecycle persists after refresh
- [ ] Confirm expense approval lifecycle persists after refresh
- [ ] Confirm CRM contact/company/deal CRUD survives refresh
- [ ] Confirm no launch-facing screen still uses native `alert` / `confirm` / `prompt`
- [ ] Confirm CRM/accounting/HR/inventory/projects detail views no longer show raw JSON popups
- [ ] Confirm HR and Payroll no longer use browser-local unlock codes and stay redacted for non-manage roles
- [ ] Confirm Accounting no longer uses browser-local unlock codes and hides detail/export actions for non-manage roles
- [ ] Confirm accounting report exports are blocked server-side for non-manage roles
- [ ] Confirm marketing campaign creation fails honestly instead of implying a saved draft
- [ ] Confirm CRM Deal Fields modal scrolls and closes correctly on laptop-height screens
- [ ] Confirm CRM field creation fails honestly when persistence is unavailable
- [ ] Confirm workflows remain org-scoped
- [ ] Confirm notifications persist through DB-backed flow
- [ ] Confirm `/pricing` no longer implies live self-serve checkout
- [ ] Confirm portal approvals reject any second/finalized decision attempt

Blocked/manual items still remaining from the smoke run:
- [ ] Role cookie checks for founder/org owner routes
- [ ] Invite flow manual/browser validation
- [ ] Accounting approval lifecycle manual/browser validation
- [ ] CRM CRUD manual/browser validation
- [ ] Upload/provider validation
- [ ] Notification write validation
- [ ] Remote environment verification outside the smoke script

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

- [ ] Confirm pricing CTAs route to sign-up/onboarding, not fake checkout
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

## 7. Prototype / Debug UI Sweep Follow-Up

- [x] Remove raw JSON alerts from launch-facing record detail views
- [x] Remove native browser prompts/confirms from launch-facing admin/settings flows
- [x] Replace export alerts with in-app toast feedback
- [x] Replace prompt-based copy flows for portal/webhook actions
- [x] Replace demo-page native alerts/confirms
- [x] Remove marketing console-backed fake create flow
- [ ] Run the prototype/debug UI checks in `docs/operations/p0-prototype-debug-ui-sweep.md`

## 8. Launch Audit Evidence

- [ ] Fill `docs/operations/p0-launch-ux-access-control-sweep.md`
- [ ] Fill `docs/operations/p0-full-launch-readiness-audit.md`
- [ ] Fill `docs/operations/p0-launch-blocker-register.md`
- [ ] Fill `docs/operations/p0-go-live-decision.md`

## 9. Go-Live Decision

- [ ] Fill `docs/operations/p0-go-live-evidence.md`
- [ ] Fill `docs/operations/p0-live-validation-log.md`
- [ ] Fill `docs/product/world-class-product-review.md`
- [ ] Fill `docs/product/top-0-1-percent-roadmap.md`
- [ ] Decide merge recommendation: `YES / NO`
- [ ] Decide deploy recommendation: `YES / NO`
