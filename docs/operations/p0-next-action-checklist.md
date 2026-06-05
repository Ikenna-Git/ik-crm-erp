# P0 Next Action Checklist

## Immediate

- [ ] Redeploy `main` on Render
- [ ] Re-test `ikenna.chilokwu@getpayedmail.com`
- [ ] Confirm the invited account cannot access founder-only pages
- [ ] Confirm the invited account cannot see users outside its own org
- [ ] Confirm the invited account only has the role intended for that org

## If The Invited Account Is Still Wrong

- [ ] Inspect the live DB row for that email
- [ ] Verify `orgId`
- [ ] Verify `role`
- [ ] Correct bad membership data if needed
- [ ] Sign the user out
- [ ] Sign the user back in
- [ ] Retest admin scope

## Core Runtime Validation

- [ ] Re-test accounting on latest `main`
- [ ] Re-test invite flow end-to-end
- [ ] Re-test login and dashboard access
- [ ] Re-test admin access rules

## Environment Validation

- [ ] Validate Upstash live behavior
- [ ] Validate SMTP live behavior
- [ ] Validate Cloudinary live behavior

## Operations Validation

- [ ] Run fake-data review on a reachable DB clone
- [ ] Perform backup
- [ ] Perform restore drill
- [ ] Run smoke tests

## Billing Validation

- [ ] Validate Stripe test-mode flow if billing remains in scope
- [ ] Keep payments marked non-live until checkout, webhook, and lifecycle are proven

## Tooling Follow-Up

- [ ] Fix `eslint` availability on `main`
- [ ] Clean up repo-wide TypeScript debt in a separate pass

## File Location

- `docs/operations/p0-next-action-checklist.md`
