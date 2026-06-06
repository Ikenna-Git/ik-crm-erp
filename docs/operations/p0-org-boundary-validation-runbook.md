# P0 Org, Invite, and Admin Boundary Validation Runbook

## Purpose

Use this runbook to verify that invited and existing users stay inside the correct workspace boundary and do not inherit founder-only platform access.

This runbook is global. It is not limited to one email address.

Validation example:

- `ikenna.chilokwu@getpayedmail.com`

## What "same admin as super admin" means

This bug exists if any non-founder user can do any of the following:

- see founder-only navigation such as `/admin/system`
- open founder-only APIs such as `/api/admin/orgs` or `/api/admin/platform-status`
- see users from another org in `/admin/users`
- see the founder/super-admin user in a normal workspace team list
- act on users outside their own org
- receive or retain `SUPER_ADMIN` outside founder-only logic
- land in the default or founder org without an invite that actually belongs there

## Preconditions

- Render has redeployed `main`
- the live deployment includes the latest boundary fix after `e6f9ddb`
- tester can sign out and sign back in
- tester knows the intended role for each test account
- tester knows the intended org/workspace for each test account

## Role expectations

### `USER`

- can use normal workspace surfaces only
- cannot access `/admin`
- cannot call admin APIs successfully

### `ADMIN`

- can open workspace admin surfaces only
- can manage same-org `USER` accounts only
- cannot create or assign `ORG_OWNER`
- cannot create or assign `SUPER_ADMIN`
- cannot access founder-only surfaces

### `ORG_OWNER`

- can open workspace admin surfaces only
- can manage same-org `USER` and `ADMIN` accounts
- cannot create or assign `SUPER_ADMIN`
- cannot access founder-only surfaces
- cannot see founder/super-admin users in the workspace team list

### Founder `SUPER_ADMIN`

- must be the true founder account only
- can access founder-only and platform-wide surfaces
- can see platform-wide org/system data
- can never be created by invite, OAuth signup, self-signup, or normal admin action

## Validation matrix

Run the same checks for:

- a future invited `USER`
- a future invited `ADMIN`
- a future invited `ORG_OWNER`
- an existing invited user
- the founder `SUPER_ADMIN`

Use `ikenna.chilokwu@getpayedmail.com` as one validation example, not the only one.

## Test steps

### 1. Clear session state

1. Sign out fully.
2. Close the tab or use a clean browser session.
3. Sign back in as the test user.

### 2. Verify workspace landing

1. Open `/dashboard`.
2. Confirm the workspace matches the user’s intended org.
3. Confirm there is no sign of the founder/default workspace unless that is the real org.

### 3. Verify admin navigation scope

1. Open `/admin`.
2. Record visible navigation items.
3. For non-founder users, confirm:
   - no `Founder Desk`
   - no platform-wide org/system wording
   - workspace admin wording stays visible only if their role allows it

### 4. Verify founder-only page blocking

For non-founder users, try:

- `/admin/system`
- `/api/admin/orgs`
- `/api/admin/platform-status`

Expected:

- blocked, forbidden, or redirected
- no platform payload returned

### 5. Verify workspace admin scope

For `ADMIN` and `ORG_OWNER` only:

1. Open `/admin/users`.
2. Confirm only same-org users are shown.
3. Confirm no users from another org appear.
4. Confirm the founder/super-admin user does not appear in the workspace team list.
4. Confirm role actions match the actor’s allowed scope:
   - `ADMIN` can manage `USER`
   - `ORG_OWNER` can manage `USER` and `ADMIN`
   - neither can create or assign `SUPER_ADMIN`

### 6. Verify direct API scope

Check these responses with browser devtools or direct requests while signed in:

- `/api/admin/users`
- `/api/admin/overview`
- `/api/admin/security`
- `/api/admin/workspace`
- `/api/admin/billing`
- `/api/admin/orgs`
- `/api/admin/platform-status`

Expected:

- same-org endpoints return only same-org data
- founder-only endpoints block non-founder users
- no cross-org payloads leak

### 7. Verify invite/signup behavior for future users

For a fresh invite:

1. Create the invite from a same-org admin or org owner.
2. Accept the invite with the exact invited email.
3. Confirm the created or activated user:
   - lands in `invite.orgId`
   - gets the invited role only
   - does not become `SUPER_ADMIN`
   - does not land in the founder/default org

### 8. Verify existing invited users

For a previously invited account such as `ikenna.chilokwu@getpayedmail.com`:

1. Sign out fully.
2. Sign back in.
3. Repeat sections 2 through 6.
4. If the account still looks wrong, move to the DB audit steps below.

## DB state verification if a test fails

Use the audit guide:

- [p0-user-org-role-audit.md](/Users/mac/Documents/code/docs/operations/p0-user-org-role-audit.md)

Minimum checks:

1. inspect the `User` row by email
2. confirm `orgId`
3. confirm `role`
4. inspect related invite/token records
5. compare `user.orgId` to `invite.orgId`
6. confirm whether the user is a non-founder `SUPER_ADMIN`
7. confirm whether the user is sitting in the default/founder org incorrectly

Do not change DB data until the intended org and intended role are confirmed.

After any DB correction:

1. sign the user out
2. sign the user back in
3. rerun this runbook

## Expected results

- no invited user is silently attached to the default/founder org in non-dev runtime
- no invite can create `SUPER_ADMIN`
- non-founder users do not see founder-only navigation
- non-founder users cannot access `/admin/system`
- `/api/admin/users` is org-scoped
- `/api/admin/users` excludes founder/super-admin rows for non-founder actors
- `/api/admin/orgs` is blocked for non-founder users
- `/api/admin/platform-status` is blocked for non-founder users
- role-based actions match the intended workspace role only

## Evidence log

| Test item | Expected result | Actual result | Pass/Fail | Notes/Evidence | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- |
| Sign out and sign back in | Clean session with current role/org claims |  |  |  |  |  |
| Dashboard workspace | Intended org only |  |  |  |  |  |
| Admin nav for `USER` | No admin plane |  |  |  |  |  |
| Admin nav for `ADMIN` | Workspace admin only |  |  |  |  |  |
| Admin nav for `ORG_OWNER` | Workspace admin only |  |  |  |  |  |
| Admin nav for founder `SUPER_ADMIN` | Founder controls visible |  |  |  |  |  |
| `/admin/system` non-founder | Blocked |  |  |  |  |  |
| `/api/admin/orgs` non-founder | Blocked |  |  |  |  |  |
| `/api/admin/platform-status` non-founder | Blocked |  |  |  |  |  |
| `/api/admin/users` scope | Same-org users only |  |  |  |  |  |
| Founder excluded from workspace team | No founder/super-admin row for non-founder actor |  |  |  |  |  |
| Invite acceptance org binding | `user.orgId === invite.orgId` |  |  |  |  |  |
| Invite acceptance role binding | User gets invited role only |  |  |  |  |  |
| `SUPER_ADMIN` leakage check | No non-founder `SUPER_ADMIN` created |  |  |  |  |  |
| Existing invited user recheck | No cross-org or founder leakage |  |  |  |  |  |
