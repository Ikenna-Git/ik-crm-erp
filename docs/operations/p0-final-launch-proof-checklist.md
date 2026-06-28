# P0 Final Launch Proof Checklist

Date: 2026-06-28
Branch: `p0-crm-erp-redesign-errors-projects-invoices-liquid-glass`
Status: `OWNER-MANUAL-VALIDATION-REQUIRED`

## Scope

This checklist is the exact manual browser proof still required before final launch sign-off on the current branch.

## Code Audit Snapshot

- Company Identity edit access is server-enforced in `/api/workspace/context` and `/api/workspace/logo`.
- Workspace identity does not use `localStorage` or `sessionStorage` for business persistence.
- Non-draft invoice issue/finalize paths are blocked when legal business name is missing.
- Issued invoice branding uses `documentIdentitySnapshot`; draft invoices use current workspace identity.
- Formal invoices do not fall back to initials as a document logo.
- Privacy unlock now returns visible human-readable errors for empty, short, too-long, weak, and wrong PIN inputs.
- CRM field editors now show visible validation, visible success state, and use scroll-safe dialogs.

## Manual Validation Table

| # | Area | Exact check | Expected result | Actual result | Pass/Fail | Notes / evidence | Tester | Date |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Company Identity | Save company/workspace display name | Save succeeds and sidebar updates immediately |  |  |  |  |  |
| 2 | Company Identity | Refresh after name change | Saved name persists after refresh |  |  |  |  |  |
| 3 | Company Identity | Upload valid PNG/JPG/WEBP logo | Upload succeeds and logo appears in sidebar/setup/settings/admin surfaces |  |  |  |  |  |
| 4 | Company Identity | Replace existing logo | Old logo is replaced and new logo persists after refresh |  |  |  |  |  |
| 5 | Company Identity | Remove existing logo | Logo clears, initials fallback appears internally, and refresh keeps fallback |  |  |  |  |  |
| 6 | Company Identity | Upload invalid logo type | Visible human-readable error, no raw JSON, no fake success |  |  |  |  |  |
| 7 | Company Identity | Upload oversized logo | Visible human-readable error, no raw JSON, no fake success |  |  |  |  |  |
| 8 | Company Identity | Owner/admin edit access | Owner/admin can save company identity |  |  |  |  |  |
| 9 | Company Identity | Non-admin edit access | Non-admin cannot edit; UI stays view-only and API denial is human-readable |  |  |  |  |  |
| 10 | Document Identity | Save legal business name | Save succeeds and persists after refresh |  |  |  |  |  |
| 11 | Document Identity | Save trading name | Save succeeds and persists if field is used |  |  |  |  |  |
| 12 | Document Identity | Save business email / phone / address | Save succeeds and persists after refresh |  |  |  |  |  |
| 13 | Document Identity | Save tax number / company registration | Save succeeds and persists after refresh |  |  |  |  |  |
| 14 | Document Identity | Save default invoice notes / terms | Future invoices pick them up where backed |  |  |  |  |  |
| 15 | Document Identity | Attempt non-draft invoice without legal business name | Visible block with human-readable error |  |  |  |  |  |
| 16 | Invoice Branding | Open invoice with logo configured | Invoice details/editor shows company logo |  |  |  |  |  |
| 17 | Invoice Branding | Open invoice after logo removal | Invoice falls back to text-only business identity, not initials-as-logo |  |  |  |  |  |
| 18 | Invoice Branding | Verify invoice notes / terms / line items | Persist after save and refresh |  |  |  |  |  |
| 19 | Snapshot/Rebrand | Create or open draft invoice | Draft uses current company identity |  |  |  |  |  |
| 20 | Snapshot/Rebrand | Issue/finalize invoice if supported | Snapshot is frozen for issued invoice |  |  |  |  |  |
| 21 | Snapshot/Rebrand | Change logo or legal business name after issuing invoice | New draft uses new identity; old issued invoice keeps old identity |  |  |  |  |  |
| 22 | Snapshot/Rebrand | If issue/finalize UI is unavailable | Mark snapshot flow code-prepared only, not browser-proven |  |  |  |  |  |
| 23 | Privacy / PIN | Empty PIN | Visible error: PIN required, no unlock |  |  |  |  |  |
| 24 | Privacy / PIN | Short PIN | Visible error: minimum length, no unlock |  |  |  |  |  |
| 25 | Privacy / PIN | Weak PIN | Visible human-readable weak-PIN error where applicable, no fake success |  |  |  |  |  |
| 26 | Privacy / PIN | Wrong PIN | Visible incorrect PIN error, no unlock |  |  |  |  |  |
| 27 | Privacy / PIN | Valid PIN | Protected content unlocks only for the current session |  |  |  |  |  |
| 28 | CRM Field Editor | Open Contacts field editor | Dialog is scrollable, actions visible, no overflow |  |  |  |  |  |
| 29 | CRM Field Editor | Save field with empty name | Visible field-name-required error |  |  |  |  |  |
| 30 | CRM Field Editor | Save select/multiselect with no options | Visible options-required error |  |  |  |  |  |
| 31 | CRM Field Editor | Create field successfully | Visible success state and new field persists after refresh |  |  |  |  |  |
| 32 | CRM Field Editor | Edit field successfully | Visible success state and change persists after refresh |  |  |  |  |  |
| 33 | CRM Field Editor | Archive field successfully | Visible success state and field disappears from active list after refresh |  |  |  |  |  |
| 34 | CRM/ERP Linking | Link CRM company/contact/deal to project | Link persists and appears in related drawer/detail UI |  |  |  |  |  |
| 35 | CRM/ERP Linking | Link CRM company/contact/deal to invoice | Link persists and appears in related drawer/detail UI |  |  |  |  |  |
| 36 | CRM/ERP Linking | Invalid project proof/external URL | Visible validation error, no fake save |  |  |  |  |  |
| 37 | CRM/ERP Linking | Invalid invoice line item values | Visible validation error, no fake save |  |  |  |  |  |
| 38 | Civis Guide | Ask about Company Identity | Guide explains where to set it and does not claim it executed changes |  |  |  |  |  |
| 39 | Civis Guide | Ask about invoice branding / rebrand behavior | Guide explains current identity vs snapshot behavior accurately |  |  |  |  |  |
| 40 | Launch Readiness | Review readiness panel after identity changes | Missing legal identity affects readiness; logo remains recommendation if configured that way |  |  |  |  |  |
| 41 | Launch Readiness | Verify database/migration readiness copy | Readiness language does not falsely claim launch-ready when blockers remain |  |  |  |  |  |

## Manual Validation Notes

- Capture screenshots for any failed or ambiguous step.
- If a step depends on provider configuration, record the exact visible UI message.
- If issue/finalize invoice UI is missing, do not mark snapshot behavior as browser-proven.
- If a non-admin role can still edit identity or upload/remove logo, treat that as a launch blocker.
