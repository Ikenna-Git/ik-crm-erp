# P0 Smoke Test Plan

Date: 2026-06-07
Branch: `p0-automated-smoke-validation`

Updated: 2026-06-19
Launch-readiness branch: `p0-customer-demo-readiness-launch-automation`

## Current Access-Control Defect History

- logged-out `/dashboard` previously returned `200`
- logged-out `/admin` previously returned `200`
- root cause: page protection lived in client-only layouts and redirected after render
- fix applied: server-side guards in dashboard and admin layouts
- live smoke retest on Render later confirmed `0 fail`

## Tooling Status

- Browser E2E tool detected: `No`
- Existing test framework detected: `No Playwright / Cypress / Jest / Vitest / Testing Library setup`
- Automated smoke approach for this branch:
  - lightweight Node-based route/access smoke runner
  - manual browser screen-check pack for write flows and role-sensitive validation

## How To Run

### Safe route smoke check

```bash
BASE_URL=https://your-render-url npm run p0:smoke
```

With debug diagnostics:

```bash
BASE_URL=https://your-render-url \
P0_SMOKE_DEBUG=1 \
npm run p0:smoke
```

Optional authenticated role checks:

```bash
BASE_URL=https://your-render-url \
FOUNDER_COOKIE='next-auth.session-token=...' \
ORG_OWNER_COOKIE='next-auth.session-token=...' \
npm run p0:smoke
```

Notes:
- the script does not print secrets
- the script does not mutate production data by default
- write-heavy flows remain manual/browser validations and are marked `BLOCKED` by the script
- pre-HTTP fetch failures are `BLOCKED`, not `FAIL`
- `WARNING` is used for preview-only or evidence-pending states that are not route failures
- `FAIL` means the app responded but the response did not match the expected behavior

### Timeout and retry tuning

Defaults:

```bash
P0_SMOKE_TIMEOUT_MS=15000
P0_SMOKE_RETRIES=2
P0_SMOKE_RETRY_DELAY_MS=3000
```

Example with a slower cold-start tolerance:

```bash
BASE_URL=https://your-render-url \
P0_SMOKE_TIMEOUT_MS=30000 \
P0_SMOKE_RETRIES=4 \
P0_SMOKE_RETRY_DELAY_MS=5000 \
npm run p0:smoke
```

### Network diagnostic behavior

- the script performs a warm-up request to `/` before the rest of the route checks
- if warm-up reaches the app, route checks continue
- if warm-up is blocked by DNS/TLS/timeout/network issues, network-dependent checks are marked `BLOCKED`
- safe reason labels include:
  - `NETWORK_ERROR`
  - `DNS_ERROR`
  - `TLS_ERROR`
  - `TIMEOUT`
  - `CONNECTION_REFUSED`
  - `CONNECTION_RESET`
  - `UNKNOWN_FETCH_ERROR`
- cookie-gated checks without cookies are marked `BLOCKED :: MISSING_COOKIE`

### If this environment cannot reach Render

If the smoke runner shows only network-blocked results from a hosted shell, rerun it from:
- your local terminal on the same machine you use for browser validation
- another trusted machine/network that can reach the Render URL

That is a connectivity limitation, not proof that the app failed its route checks.

## Logged-Out Protected Expectations

- `/dashboard` must redirect to `/login` or return `401/403`
- `/dashboard/*` must redirect to `/login` or return `401/403`
- `/admin` must redirect to `/login` or return `401/403`
- `/admin/*` must redirect to `/login` or return `401/403`
- `/api/admin/orgs` must return `401/403`
- `/api/admin/platform-status` must return `401/403`
- `/admin/system` must redirect to `/login` or return `401/403`
- `/api/admin/launch-readiness` must return `401/403`

## Coverage Matrix

| Area | Automated smoke | Manual browser validation required | Notes |
| --- | --- | --- | --- |
| Auth and access | Yes | Yes | Script checks logged-out route blocking and optional cookie-based founder/org-owner access |
| Admin and org boundary | Partial | Yes | Script checks safe route/API access; team-list content still needs browser validation |
| Founder launch readiness | Partial | Yes | Script checks protection and safe JSON shape only |
| Invite flow | No | Yes | Must validate create invite, accept invite, org attachment, role assignment manually |
| Accounting approvals | No | Yes | Script intentionally avoids mutating approval state |
| CRM CRUD | No | Yes | Script does not create/edit/delete production-like records by default |
| Operations approvals/workflows | No | Yes | List/action persistence remains a manual live check |
| Settings persistence | No | Yes | Must verify profile/workspace saves in browser |
| Uploads / Cloudinary | No | Yes | Uploads are write operations |
| Notifications persistence | No | Yes | Creation/read state is a write flow |
| Billing / Stripe | Partial docs only | Yes | Remains blocked until Stripe test env is validated |

## P0 Areas To Validate

### A. Auth and access
- logged-out dashboard access blocked
- logged-out admin access blocked
- founder login path documented
- org owner login path documented
- normal user login path documented

### B. Admin and org boundary
- `SUPER_ADMIN` can access Founder Desk/platform controls
- `SUPER_ADMIN` can access `/admin/launch-readiness`
- `ORG_OWNER` cannot access Founder Desk
- `ORG_OWNER` cannot access `/admin/system`
- `ORG_OWNER` cannot access `/admin/launch-readiness`
- `ORG_OWNER` cannot access `/api/admin/orgs`
- `ORG_OWNER` cannot access `/api/admin/platform-status`
- `ORG_OWNER /admin/users` shows same-org users only
- founder user is hidden from org owner team list

### B2. Launch readiness API safety
- founder `/api/admin/platform-status` returns safe provider diagnostics only
- founder `/api/admin/launch-readiness` returns launch sections only
- neither endpoint returns env secrets or raw secret-like keys

### C. Invite flow
- founder creates/selects org
- founder invites org owner
- invited user lands in invite org
- invited user gets intended role
- invite cannot create `SUPER_ADMIN`
- invite cannot attach user to default/founder org

### D. Accounting and approvals
- invoice approval can be requested once
- duplicate request while pending is blocked
- invoice approval appears in Operations
- approve/reject persists after refresh
- approved/rejected item cannot be requested again
- expense follows same lifecycle
- no cross-org approvals appear

### E. CRM
- contact create/edit/delete persists
- company create/edit/delete persists
- deal create/edit/delete persists
- updates/deletes are org-scoped

### F. Operations
- approvals list loads
- approve/reject works only for pending items
- integrations/reports do not claim fake persistence
- workflows update path is org-scoped

### G. Settings
- profile/settings save honestly
- workspace name persistence works if supported
- unsupported security toggles do not claim persistence

### H. Uploads
- Cloudinary configured: upload succeeds
- Cloudinary missing: clear configuration error
- no fake upload success

### I. Notifications
- notifications use real persistence
- no in-memory fake success

### J. HR and inventory
- payroll approvals clearly unavailable if backend persistence is not implemented
- purchase approvals clearly unavailable if backend persistence is not implemented

### K. Billing
- if Stripe is missing, billing fails safely
- if Stripe test env is configured, checkout/webhook validation steps are documented
- payments remain non-live until validated

### L. Environment validation
- `DATABASE_URL` present
- `NEXTAUTH_URL` present
- `NEXTAUTH_SECRET` present
- `PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_URL` present
- dev/demo flags false
- Upstash configured or marked blocked
- SMTP configured or marked blocked
- Cloudinary configured or marked blocked
- observability configured or marked blocked
- Stripe configured or marked blocked

## Browser Validation Plan

No Playwright/Cypress setup is being introduced in this branch.

Use a manual browser pass for:
- landing page loads without horizontal overflow on laptop and mobile
- pricing page loads
- login page loads
- logged-out `/dashboard` redirects
- logged-out `/admin` redirects
- CTA links exist on landing
- `/admin/launch-readiness` loads for founder
- `/dashboard/setup` loads for workspace admin
