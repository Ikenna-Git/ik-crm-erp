# P0 Screen Check Runbook

Date: 2026-06-07

## Core Checks After Redeploy
1. `/pricing`
   - CTA routes to sign-up
   - page does not imply live self-serve checkout
2. `/dashboard`
   - Civis Pulse appears
   - setup blockers and trust statuses look honest
3. `/dashboard/ai`
   - “take me to pricing” opens pricing
   - “open gallery” opens gallery
   - “log me out” signs out or shows a real logout action
   - “what can I do here?” produces current-page guidance
4. `/dashboard/hr`
   - restricted user cannot reveal employee contact/salary details
   - restricted user cannot reveal payroll amounts/details
5. `/dashboard/accounting`
   - restricted user cannot reveal invoice/expense details
   - finance user can still use approvals, edit, export
6. `/dashboard/marketing`
   - sample/preview-only messaging is visible
   - no fake campaign create/send/report success
7. `/admin/system`
   - founder trust cards show route guards / org isolation / role access healthy
   - backup / restore / fake-data items remain action required until real evidence exists

## Evidence Fields
- route
- role
- expected result
- actual result
- pass / fail
- evidence link or screenshot note
