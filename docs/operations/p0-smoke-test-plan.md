# P0 Smoke Test Plan

Date: 2026-06-07
Branch: `p0-fix-protected-page-route-guards`

## Current Access-Control Defect History

- logged-out `/dashboard` previously returned `200`
- logged-out `/admin` previously returned `200`
- root cause: page protection lived in client-only layouts and redirected after render
- fix applied: server-side guards in dashboard and admin layouts

## Logged-Out Protected Page Expectations

- `/dashboard` must redirect to `/login` or return `401/403`
- `/dashboard/*` must redirect to `/login` or return `401/403`
- `/admin` must redirect to `/login` or return `401/403`
- `/admin/*` must redirect to `/login` or return `401/403`
- `/admin/system` must redirect/block for logged-out users

## Logged-Out Protected API Expectations

- `/api/admin/orgs` must return `401/403`
- `/api/admin/platform-status` must return `401/403`

## Retest Required After Render Redeploy

Run:

```bash
BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke
```

Expected:

- `/`, `/login`, `/pricing` remain public
- `/dashboard` no longer returns `200` for logged-out users
- `/admin` no longer returns `200` for logged-out users
- protected APIs remain `401/403`

