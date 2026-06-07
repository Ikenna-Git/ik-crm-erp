# P0 Prototype / Debug UI Sweep

Date: 2026-06-07  
Branch: `p0-remove-prototype-debug-ui`

## Purpose

This sweep removes leftover prototype/debug UI from launch-facing flows so users do not see:

- native browser `alert` / `confirm` / `prompt` dialogs for real workflows
- raw JSON record dumps
- fake-success behavior for unimplemented actions
- console-driven debug behavior standing in for product UX

## Scope

- CRM
- accounting
- HR
- inventory
- projects
- admin
- settings / 2FA
- operations
- portal
- analytics
- demo library
- marketing

## Findings Table

| File | Line / function / component | Feature area | Issue type | Current behaviour before fix | Risk level | Action taken | Fixed | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `components/crm/contacts-table.tsx` | `handleViewDetails` | CRM | Raw JSON alert | Contact details opened through `alert(JSON.stringify(...))` | P0 | Replaced with `RecordDetailsDialog` | Yes | Structured contact details now render in-app |
| `components/accounting/invoices-table.tsx` | `handleViewDetails` | Accounting | Raw JSON alert | Invoice details opened through native alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Approval/status/date fields now display clearly |
| `components/accounting/expenses-table.tsx` | `handleViewDetails` | Accounting | Raw JSON alert | Expense details opened through native alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Preserves persisted status/approval context |
| `components/hr/employees-table.tsx` | `handleViewDetails` | HR | Raw JSON alert | Employee record dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Salary and department fields now render safely |
| `components/hr/payroll-table.tsx` | `handleViewDetails` | HR | Raw JSON alert | Payroll record dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Payroll approval remains explicitly not implemented |
| `components/inventory/orders-table.tsx` | `handleViewDetails` | Inventory | Raw JSON alert | Order details dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Purchase approvals remain clearly unavailable |
| `components/inventory/products-table.tsx` | `handleViewDetails` | Inventory | Raw JSON alert | Product details dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | SKU / supplier / pricing shown in-app |
| `components/inventory/stock-levels.tsx` | `handleViewDetails` | Inventory | Raw JSON alert | Stock item details dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Reorder/location/status shown in-app |
| `components/projects/projects-board.tsx` | `handleViewDetails` | Projects | Raw JSON alert | Project details dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Budget/spend/date fields now structured |
| `components/projects/tasks-kanban.tsx` | `handleViewDetails` | Projects | Raw JSON alert | Task details dumped into alert | P0 | Replaced with `RecordDetailsDialog` | Yes | Priority/assignee/status now visible without raw JSON |
| `app/(dashboard)/dashboard/analytics/page.tsx` | export actions | Analytics | Native alert | Export/email outcomes shown via browser alerts | P0 | Replaced with app toasts | Yes | Success and error states now match platform UX |
| `app/(dashboard)/dashboard/crm/page.tsx` | export actions | CRM | Native alert | Export/email outcomes shown via browser alerts | P0 | Replaced with app toasts | Yes | No raw browser modal remains |
| `app/(dashboard)/dashboard/accounting/page.tsx` | export actions | Accounting | Native alert | Export/email outcomes shown via browser alerts | P0 | Replaced with app toasts | Yes | Compliance/export states now use in-app feedback |
| `app/(dashboard)/dashboard/projects/page.tsx` | report export | Projects | Native alert | Report action used informational browser alert | P1 | Replaced with informational toast | Yes | Still requires live persistence validation if export backend exists |
| `app/(dashboard)/dashboard/settings/2fa/page.tsx` | disable 2FA | Settings / security | Native prompt | Password requested via `prompt()` | P0 | Added proper dialog with password input | Yes | 2FA disable remains server-backed |
| `app/(admin)/admin/users/page.tsx` | remove user | Admin | Native confirm | User removal confirmation used `window.confirm()` | P0 | Added `AlertDialog` confirmation | Yes | Server-side delete path preserved |
| `app/(admin)/admin/system/page.tsx` | suspend/archive reason | Founder/system | Native prompt | Reason captured via `window.prompt()` | P0 | Added reason dialog before submit | Yes | Restore path left direct because no reason is needed |
| `app/(dashboard)/dashboard/operations/page.tsx` | copy webhook secret | Operations | Native prompt fallback | Secret displayed in `window.prompt()` for copy | P0 | Replaced with clipboard + toast flow | Yes | No secret value is echoed through a prompt anymore |
| `app/(dashboard)/dashboard/portal/page.tsx` | copy portal link | Portal | Native prompt fallback | Link displayed in `window.prompt()` for copy | P1 | Replaced with clipboard + toast flow | Yes | Failure now surfaces via toast |
| `app/(dashboard)/dashboard/demo/page.tsx` | share / download / delete | Demo | Native alert / confirm | Share/download used alerts; delete used `confirm()` | P1 | Replaced with toasts and `AlertDialog` | Yes | Demo content is still local/demo-scoped by design |
| `app/(dashboard)/dashboard/marketing/page.tsx` | create campaign | Marketing | Debug log / fake-success risk | Action only logged payload to console and implied creation | P0 | Replaced with explicit unavailable toast | Yes | Persistence is not implemented and now stated honestly |
| `components/pwa-provider.tsx` | install prompt | PWA | Browser install prompt API | Uses the browser install event’s `prompt()` method | P2 | Left as-is | N/A | This is the platform install API, not prototype/debug UI |

## Remaining Notes

- The PWA install flow still calls the browser install prompt API. That is intentional platform behavior and not part of the prototype/debug UI class.
- Some modules remain intentionally unavailable or partially implemented. These are acceptable only when the UI says so clearly before users trust the action.
- Known examples that still require live/manual validation:
  - accounting approval persistence
  - CRM CRUD persistence
  - notifications persistence
  - Cloudinary upload behavior
  - invite flow role/org attachment

## Exit Criteria For This Sweep

- no remaining native browser `alert` / `confirm` / `prompt` calls in live app code for business workflows
- no raw JSON popups for record details
- unsupported actions are disabled or clearly marked unavailable
- fake-success messaging is removed from launch-facing paths
- previous P0 org/auth/security fixes remain intact
