# P0 User Org and Role Audit

## Purpose

Older bugs may already have created users with the wrong `orgId` or `role`.

This guide is for audit and repair planning. It is report-first. Do not change data until the intended org and intended role are confirmed.

## What to look for

### Suspicious user rows

Review users where:

- `role = SUPER_ADMIN` and `email` is not the founder email
- `orgId` matches the founder/default org but the user should belong to another workspace
- the user was invited into one org but currently belongs to another
- the user has workspace-admin access but should only be `USER`
- the founder/super-admin user appears in a normal workspace team list for an `ORG_OWNER` or `ADMIN`
- a workspace admin session can see users from outside its own org

## Core checks

### 1. Inspect the user row by email

For a target email such as `ikenna.chilokwu@getpayedmail.com`, record:

- `id`
- `email`
- `orgId`
- `role`
- `createdAt`
- whether the user has a local password
- whether linked OAuth accounts exist

### 2. Inspect invite or token records

Find the invite/token record that created or refreshed the signup link.

Record:

- invited email
- invited `orgId`
- invite issue time
- invite expiry
- whether the invite was consumed

### 3. Compare user org to invite org

Confirm:

- `user.orgId === invite.orgId`

If not, the account was attached to the wrong workspace at some point.

### 4. Identify non-founder `SUPER_ADMIN`

Any `SUPER_ADMIN` account whose email is not the founder email is suspicious and should be reviewed.

### 5. Identify users in the founder/default org who should belong elsewhere

Review:

- invited users whose current `orgId` equals the founder/default org
- accounts created after an invite was sent to another org
- OAuth-created accounts with no legitimate founder relationship

## Suggested report-only queries

Use the app schema or Prisma studio/query tooling available to you. Keep the output scoped to the review target and do not dump unrelated PII.

Minimum report fields:

- user email
- user role
- user orgId
- org name
- invite orgId
- invite email
- invite consumed state
- whether the user appeared in another org’s `/api/admin/users` response

## Safe correction workflow

Only after confirming the intended workspace and intended role:

1. record the current row values before any change
2. correct `orgId` if it is wrong
3. correct `role` if it is too powerful or otherwise wrong
4. do not assign `SUPER_ADMIN` unless the account is the true founder account
5. preserve an audit note outside the DB migration path if your team keeps an ops log
6. if a founder/super-admin row was attached to a normal workspace, move that row back to the correct founder org before retesting workspace admin visibility

## After correction

1. sign the user out
2. sign the user back in
3. rerun:
   - [p0-org-boundary-validation-runbook.md](/Users/mac/Documents/code/docs/operations/p0-org-boundary-validation-runbook.md)

## Retest checklist

- dashboard shows the correct workspace
- `/admin/users` shows only same-org users
- founder-only pages are blocked for non-founder users
- role-based actions match the corrected role
- no platform org/system APIs return data for non-founder users

## Notes

- This guide does not change production data by itself.
- If you later add an audit script, keep it dry-run by default, avoid printing secrets, and require explicit confirmation before any corrective action.
