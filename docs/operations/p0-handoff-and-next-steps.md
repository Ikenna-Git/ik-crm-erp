# P0 Handoff And Next Steps

## Current Branch And Deploy Model

- Current working branch: `main`
- Current deploy model: Render is using `main`
- No separate paid staging service is in use right now

## What Has Already Been Done

### Access And Admin Boundary Work

- Added organization owner hierarchy and job-based access control.
- Locked founder-only platform access behind explicit `SUPER_ADMIN` checks.
- Added org-owner billing foundation and workspace lifecycle controls.
- Removed live demo leakage and tightened portal/docs access.
- Removed seeded demo data from live workspaces.

### Invite, Onboarding, And Auth Work

- Fixed public invite URLs on Render.
- Added invite email delivery.
- Stabilized onboarding and invite flows.
- Added signup password visibility control and browser autofill mitigation.
- Fixed Google auth user creation issues earlier on `main`.
- Fixed profile identity flash and sync issues.

### Accounting And Dashboard Stability Work

- Fixed notification center runtime crash.
- Fixed unified search category crash.
- Stabilized accounting UI and added accounting containment/error handling.
- Restored accounting error state after the client crash regression.

### Production Readiness And Platform Work

- Added admin ops center and incident feed.
- Added org lifecycle management.
- Added org-owner billing controls.
- Added environment and P0 operations documentation earlier in the repo history.

### Most Recent Security Fix On `main`

Latest pushed boundary fix:

- `e6f9ddb` `Fix org boundary leaks in auth and admin routes`

This changed:

- `lib/request-user.ts`
  - non-dev requests no longer auto-create users into the default org
- `lib/credentials-signup.ts`
  - invite signup now uses the invite org
  - non-invite self-signup is blocked from silently creating into the default org
- `lib/auth.ts`
  - OAuth user creation no longer silently drops non-founder users into the default org in non-dev mode
- `lib/access-route.ts`
  - shared authenticated/admin/super-admin guard helpers
- `app/api/admin/users/route.ts`
  - admin user management now runs through the shared admin guard
- `app/api/admin/orgs/route.ts`
  - workspace creation/status changes now run through the shared super-admin guard
- `lib/runtime-flags.ts`
  - central dev-only fallback flags are now explicit

## What This Means Right Now

The main code path that could silently attach a signed-in account to the default workspace has been removed from non-dev runtime.

That was the critical class of bug behind:

- invited users landing in the wrong org
- wrong admin scope
- possible cross-org visibility if the wrong org membership had already been assigned

## What Still Needs To Be Done Next

### Immediate P0 Next Step

1. Redeploy `main` on Render.
2. Retest the invited account:
   - `ikenna.chilokwu@getpayedmail.com`
3. Verify:
   - it does **not** see founder-only pages
   - it does **not** see users outside its own org
   - it only sees admin controls appropriate to its own role and org

### If The Invited Account Still Sees Cross-Org Data

At that point, the next likely issue is not the code path anymore. It is existing database state that was created before the fix.

That means the account record may already have:

- the wrong `orgId`
- the wrong `role`
- or both

If that happens, the next step is:

1. inspect the actual user row in the live database
2. correct the wrong `orgId` / `role`
3. sign the user out
4. sign the user back in
5. retest admin scope

Note:

- this workspace could not verify that user row locally because the configured Render Postgres host was not reachable from this environment

## Remaining P0 Items After The Org-Boundary Fix

These are the remaining P0 items to finish on `main`:

### P0 Validation

- redeploy and re-verify org boundary fix
- verify accounting page after latest `main` deploy
- verify invite acceptance end-to-end after latest `main` deploy

### Environment Validation

- validate Upstash rate limiting live, not just env presence
- validate SMTP live, not just env presence
- validate Cloudinary live, not just env presence

### Operational Validation

- run fake-data review against a reachable DB clone
- perform backup
- perform restore drill
- run the production smoke tests

### Billing / Provider Validation

- Stripe is the only implemented billing runtime path
- Stripe must still be validated in test mode before any billing claim can be made
- payments are still not live

### Dependency / Tooling Follow-Up

- repo lint on `main` still depends on `eslint`, which is not currently installed in this dependency state
- repo-wide TypeScript debt still exists in multiple unrelated files
- those issues are broader than the org-boundary fix and need their own cleanup pass

## Recommended Order From Here

1. Redeploy `main`
2. Retest the invited org account boundary
3. If still wrong, repair the affected DB user record
4. Re-verify accounting
5. Re-verify SMTP invite flow
6. Re-verify Cloudinary uploads
7. Re-verify Upstash-backed rate limiting
8. Run fake-data review
9. Perform backup and restore drill
10. Validate Stripe test-mode flow if billing is still in scope

## Going Forward

Use this working model:

- deploy branch: `main`
- development style: short-lived fix branches from `main`
- verify exact route, exact query, exact error before patching
- do not rely on staging-only assumptions if deployment is happening from `main`

## Download / File Location

This handoff file is in the repo at:

- `docs/operations/p0-handoff-and-next-steps.md`
