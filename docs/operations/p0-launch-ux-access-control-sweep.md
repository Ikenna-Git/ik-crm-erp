# P0 Launch UX Access Control Sweep

Date: 2026-06-07  
Branch: `p0-launch-ux-world-class-sweep`

## Scope

- HR module redaction and action gating
- Accounting module redaction and action gating
- Shared record details dialog hardening
- Report export entitlement enforcement
- CRM deal-field modal overflow and persistence honesty
- Marketing preview-only honesty

## Confirmed Fixes In Code

| Area | Before | After |
| --- | --- | --- |
| HR employees | Browser-local unlock code controlled salary/detail visibility | Role-based redaction; non-manage users cannot reveal details or mutate records |
| HR payroll | Browser-local unlock code controlled payroll export/detail visibility | Role-based redaction; non-manage users cannot export, inspect, or mutate payroll records |
| Accounting invoices/expenses | Amount masking was local-only and detail/export actions remained too open | Non-manage users see redacted accounting shell; detail/export/approval/edit/delete actions are unavailable |
| Report exports | All exports relied on `analytics:view` | Accounting/VAT/audit require `accounting:manage`; CRM exports require `crm:manage`; analytics remains `analytics:view` |
| Shared detail dialog | Large content could overflow and no locked state existed | Internal scroll, consistent close action, and locked/redacted presentation supported |
| CRM Deal Fields | Modal could trap overflow and DB outage could fake local success | Modal scrolls safely and persistence outage fails honestly |
| Marketing | Actions looked real despite no persistence/sending | Preview-only messaging and disabled actions reduce false trust |

## Manual Validation Still Required

1. Sign in as a non-manage HR viewer and confirm:
   - no local unlock UI is present
   - employee details do not open
   - salaries and payroll amounts stay masked
2. Sign in as a non-manage accounting viewer and confirm:
   - no local unlock UI is present
   - invoice/expense details do not open
   - exports and approval actions are unavailable
3. Call or browse to accounting export flows as a non-manage role and confirm the server returns a blocked response.
4. Open CRM `Deal Fields` on a laptop-height viewport and confirm:
   - content scrolls internally
   - close control remains accessible
5. Simulate or observe a CRM fields persistence outage and confirm:
   - no local-only “saved” behavior appears
   - the screen shows an honest failure state
6. Open `/dashboard/marketing` and confirm:
   - preview-only messaging is visible
   - disabled actions do not imply campaign persistence or sending
