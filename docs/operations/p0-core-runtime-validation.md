# P0 Core Runtime Validation

## Purpose

Use this runbook to validate the next P0 runtime block after the latest admin/org-boundary fix:

1. accounting page validation
2. invite flow end-to-end
3. login and dashboard access
4. quick admin regression checks

This runbook is intended for the live Render deployment that serves `main`.

## Persistence Rule

- Core runtime flows must persist through server/API/database state.
- Browser storage may be used only for local UI preferences or temporary client convenience.
- A green toast, badge change, or tab update does not count as a pass unless the state still matches after refresh or a new session.

## Preconditions

- `main` has been redeployed on Render with the latest P0 boundary fixes
- tester can sign out and sign back in
- founder/super-admin account is available
- at least one invited org owner account is available
- browser devtools and Render logs are available if something fails

## A. Accounting Validation

### Steps

1. Sign in to the target workspace.
2. Open `/dashboard/accounting`.
3. Verify the accounting page loads without a full-page runtime crash.
4. Verify invoices load.
5. Verify expenses load.
6. Verify summary/reports widgets load.
7. Verify empty states render safely if there is no data.
8. If any section errors, verify the route contains the failure safely instead of crashing the whole app.
9. Verify no cross-org accounting data appears.
10. If something fails, capture:
   - route
   - browser console error
   - failed network request if any
   - server/Render log line if available
11. If an action mutates accounting data, refresh the page and confirm the same state comes back from the API.

### Expected result

- accounting loads
- invoices load or show a safe empty state
- expenses load or show a safe empty state
- summary widgets load or show a safe fallback
- no client-side crash
- no cross-org data leakage

## B. Invite Flow End-to-End

### Steps

1. Sign in as founder/platform super-admin.
2. If needed, create or select the target org/workspace.
3. Invite an org owner from the founder/system flow.
4. Confirm one of the following:
   - invite email is delivered
   - or a manual invite link is generated for sharing
5. Open the invite link in a clean browser session.
6. Accept the invite with the invited email.
7. Complete signup/login.
8. Verify the invited user lands in the intended org.
9. Verify the invited user gets the intended role.
10. Verify the invited user does not see founder-only controls.
11. Verify the invited user sees only own-org users in `/admin/users`.
12. Sign out and sign back in once more.
13. Verify the invited user still lands in the same org and did not fall back to the founder/default org.

### Expected result

- invite is issued successfully
- invite link works
- invited user lands in the correct org
- invited user gets only the intended role
- invited user does not inherit founder access
- invited user sees only own-org data

## C. Login and Dashboard Access

### Steps

1. While logged out, open `/dashboard`.
2. Verify the user is redirected or blocked.
3. Log in as a normal user.
4. Verify login succeeds.
5. Verify dashboard loads.
6. Log in as an invited org owner.
7. Verify login succeeds.
8. Verify dashboard loads the correct workspace.
9. Watch for:
   - profile/org identity flash
   - default-org leakage
   - incorrect workspace name or users
10. Verify the header/profile identity is correct after refresh and does not rely on stale browser storage.

### Expected result

- logged-out user cannot access the dashboard directly
- normal user can log in and load the correct workspace
- invited org owner can log in and load the correct workspace
- no default-org leakage
- no transient wrong-org flash that resolves to another org

## D. Admin Regression Check

### Steps

1. Sign in as founder/platform super-admin.
2. Verify founder can access:
   - `/admin`
   - `/admin/system`
   - `/api/admin/orgs`
   - `/api/admin/platform-status`
3. Sign out and sign in as org owner.
4. Verify org owner:
   - can access workspace admin only
   - cannot see Founder Desk
   - cannot access `/admin/system`
   - cannot access `/api/admin/orgs`
   - cannot access `/api/admin/platform-status`
   - sees same-org users only in `/admin/users`
   - does not see founder/super-admin in the workspace team list
5. Verify browser refresh does not change admin scope or reveal founder navigation.

### Expected result

- founder/platform super-admin can access founder/platform controls
- org owner cannot access founder/platform controls
- org owner `/admin/users` is same-org only
- founder/super-admin is not visible in org owner team views

## Failure Handling

If a defect is found, record:

- exact route/page
- expected result
- actual result
- browser console error
- failed network request
- server/Render log evidence if available

Do not patch unrelated areas while validating. Isolate the failing route and error first.

## Additional Screen Checks

- `/dashboard/operations`
  - approvals reflect persisted server state
  - integrations tab does not imply saved connection state without backend/provider evidence
  - saved reports tab does not imply persistence without backend support
- `/dashboard/playbooks`
  - launched run still exists after refresh
  - paused/advanced state stays correct after refresh
- `/dashboard/settings`
  - workspace name persists if changed
  - security toggles do not claim persistence unless a backend route actually saves them

## Evidence Table

| Test item | Expected result | Actual result | Pass/Fail | Evidence/Notes | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- |
| Accounting route loads | No full-page crash |  |  |  |  |  |
| Invoices load | Rows or safe empty state |  |  |  |  |  |
| Expenses load | Rows or safe empty state |  |  |  |  |  |
| Accounting summary/widgets | Load or safe fallback |  |  |  |  |  |
| Accounting org scope | No cross-org accounting data |  |  |  |  |  |
| Founder creates/selects org | Target org ready for invite |  |  |  |  |  |
| Org owner invite issued | Email or manual link available |  |  |  |  |  |
| Invited user accepts invite | Invite works end-to-end |  |  |  |  |  |
| Invited user org binding | Lands in correct org |  |  |  |  |  |
| Invited user role binding | Intended role only |  |  |  |  |  |
| Invited user founder controls | Not visible |  |  |  |  |  |
| Invited user team scope | Same-org users only |  |  |  |  |  |
| Logged-out dashboard access | Blocked or redirected |  |  |  |  |  |
| Normal user login | Succeeds |  |  |  |  |  |
| Normal user dashboard | Correct workspace loads |  |  |  |  |  |
| Org owner login | Succeeds |  |  |  |  |  |
| Org owner dashboard | Correct workspace loads |  |  |  |  |  |
| No default-org leakage | No wrong-org landing/flash |  |  |  |  |  |
| Founder Desk access | Founder only |  |  |  |  |  |
| Org owner Founder Desk access | Blocked |  |  |  |  |  |
| Org owner `/api/admin/orgs` | Blocked |  |  |  |  |  |
| Org owner `/api/admin/platform-status` | Blocked |  |  |  |  |  |
| Org owner `/admin/users` scope | Same-org only |  |  |  |  |  |
| Founder hidden from org team | Not shown to org owner |  |  |  |  |  |

## Local Verification Notes

Local checks can confirm build/runtime integrity only:

- `npx prisma generate`
- `npm run build`

They do not replace live Render/browser validation for:

- invite delivery
- login session correctness
- dashboard org identity
- cross-org data visibility
- founder/org-owner runtime separation
