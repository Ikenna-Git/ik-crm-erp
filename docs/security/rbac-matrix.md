# Civis RBAC Matrix

Updated: 2026-05-06

This document describes the current centralized action-level RBAC matrix implemented in `lib/rbac.ts`.

## Roles

- `USER`
- `ADMIN`
- `ORG_OWNER`
- `SUPER_ADMIN`

## Current High-Risk Actions

| Action | USER | ADMIN | ORG_OWNER | SUPER_ADMIN |
|---|---|---|---|---|
| `reports.export` | No | Yes | Yes | Yes |
| `reports.export.email` | No | Yes | Yes | Yes |
| `uploads.manage` | Module-based | Module-based | Module-based | Module-based |
| `billing.view` | No | Yes | Yes | Yes |
| `billing.manage` | No | No | Yes | Yes |
| `billing.providerRefs.manage` | No | No | No | Yes |
| `admin.users.invite` | No | Yes | Yes | Yes |
| `admin.users.roleChange` | No | Yes | Yes | Yes |
| `admin.users.delete` | No | Yes | Yes | Yes |
| `admin.orgs.manage` | No | No | No | Yes |
| `webhooks.manage` | No | Yes | Yes | Yes |
| `audit.read` | No | Yes | Yes | Yes |
| `audit.write` | No | Yes | Yes | Yes |
| `rollback.execute` | No | Yes | Yes | Yes |

## Module-Aware Actions

These actions also require module access in addition to role checks where applicable:

- `crm.view`
- `crm.manage`
- `accounting.view`
- `accounting.manage`
- `tasks.manage`
- `ops.workflows.manage`
- `playbooks.manage`
- `portal.manage`
- `ai.use`
- `uploads.manage`

## Important Boundaries

- `SUPER_ADMIN` remains founder/platform-only
- `ORG_OWNER` is highest authority inside one workspace
- `ADMIN` can manage users inside the workspace but cannot become platform super-admin
- UI visibility is not trusted by itself; server-side checks enforce the final decision

## Current Limitations

- The matrix is now centralized for high-risk actions, but not every single CRUD action in every module has a bespoke action code yet
- Commercial/plan gating is only partial and currently applied to a small set of paid features
