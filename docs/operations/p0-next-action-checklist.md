# P0 Next Action Checklist

Date: 2026-06-07

## Immediate
- [ ] Redeploy the branch after merge to `main`
- [ ] Re-run smoke test against Render
- [ ] Validate HR privacy PIN:
  - [ ] correct PIN unlocks HR only
  - [ ] wrong PIN shows clear error
  - [ ] lock again hides details
- [ ] Validate Accounting privacy PIN:
  - [ ] correct PIN unlocks Accounting only
  - [ ] wrong PIN shows clear error
  - [ ] lock again hides details
- [ ] Validate AI commands:
  - [ ] take me to pricing
  - [ ] open gallery
  - [ ] open admin as permitted role
  - [ ] log me out
  - [ ] what can I do here
  - [ ] what is blocked
  - [ ] I’m lost
  - [ ] how do I create an invoice?
  - [ ] unlock accounting
- [ ] Validate restricted HR user cannot see employee/payroll detail data
- [ ] Validate restricted Accounting user cannot see invoice/expense detail data
- [ ] Validate Civis Pulse appears with honest blockers and next steps
- [ ] Validate Marketing remains preview-only with no fake success
- [ ] Validate landing page premium redesign on laptop and mobile
- [ ] Validate sidebar grouping and privacy-lock badges

## Required Before Launch Sign-off
- [ ] Invite flow end-to-end on live
- [ ] Accounting approval flow after refresh
- [ ] CRM create / edit / delete after refresh
- [ ] Founder versus org-owner admin boundary retest
- [ ] Cloudinary validation
- [ ] SMTP validation
- [ ] Upstash validation
- [ ] AI provider configured / missing-key validation
- [ ] Stripe billing decision or validation
- [ ] HR privacy PIN live evidence
- [ ] Accounting privacy PIN live evidence
- [ ] Backup evidence
- [ ] Restore drill evidence
- [ ] Fake-data review evidence
