# P0 Next Action Checklist

Date: 2026-06-19
Branch: `p0-customer-demo-readiness-launch-automation`

## Immediate After Merge + Redeploy
- [ ] Open `/admin/launch-readiness` as founder
- [ ] Open `/dashboard/setup` as workspace admin or org owner
- [ ] Run `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke`
- [ ] Confirm `/api/admin/launch-readiness` is founder-protected
- [ ] Confirm provider diagnostics show configured / partial / missing only, with no secret leakage

## Founder Live Checks
- [ ] Founder can open `/admin`
- [ ] Founder can open `/admin/system`
- [ ] Founder can open `/admin/launch-readiness`
- [ ] Launch Readiness shows provider, module, and evidence sections
- [ ] Founder can still provision a stakeholder workspace

## Org Owner Live Checks
- [ ] Org owner can open `/admin`
- [ ] Org owner cannot open `/admin/system`
- [ ] Org owner cannot open `/admin/launch-readiness`
- [ ] Org owner cannot access `/api/admin/orgs`
- [ ] Org owner cannot access `/api/admin/platform-status`
- [ ] Org owner sees only same-org users on `/admin/users`

## Restricted User Live Checks
- [ ] Restricted user cannot access `/admin`
- [ ] Restricted user cannot see HR details while locked
- [ ] Restricted user cannot see Accounting details while locked
- [ ] Restricted user cannot see founder-only controls or cross-org data

## Workflow Evidence Required Before Launch Sign-off
- [ ] Invite flow: create invite, accept invite, confirm correct org and role
- [ ] CRM: create contact, company, deal; refresh confirms persistence
- [ ] Accounting: invoice and expense load correctly
- [ ] Accounting approvals: request, approve/reject, refresh confirms state
- [ ] Operations approvals: pending list is org-scoped and final states cannot be replayed
- [ ] HR privacy PIN: wrong PIN, correct PIN, re-lock
- [ ] Accounting privacy PIN: wrong PIN, correct PIN, re-lock, exports respect lock
- [ ] Civis Guide deterministic commands:
  - [ ] take me to pricing
  - [ ] open gallery
  - [ ] open CRM
  - [ ] open accounting
  - [ ] open HR
  - [ ] open settings
  - [ ] open admin
  - [ ] log me out
  - [ ] what can I do here?
  - [ ] what should I do next?
  - [ ] I’m lost
  - [ ] how do I create an invoice?
  - [ ] unlock accounting

## Provider Validation
- [ ] SMTP validated or intentionally deferred
- [ ] Cloudinary validated or intentionally deferred
- [ ] Upstash validated or intentionally deferred
- [ ] AI provider validated or deterministic-only mode documented
- [ ] Stripe decision recorded: test-validated, deferred, or not in launch scope
- [ ] Observability / security alert routing validated or deferred with owner

## Trust and Release Evidence
- [ ] Backup evidence recorded
- [ ] Restore drill evidence recorded
- [ ] Fake-data review recorded
- [ ] Launch blocker register updated
- [ ] Go-live decision updated from current evidence, not optimism
