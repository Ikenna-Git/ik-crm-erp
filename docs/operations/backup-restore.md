# Civis Backup And Restore Discipline

Updated: 2026-05-06

This document is the minimum backup and restore discipline for Civis while the platform runs on PostgreSQL via Prisma.

## Scope

- Primary relational data: PostgreSQL
- Critical metadata: auth/session-linked records, org/user/admin state, billing metadata, audit logs, portal records, uploads metadata
- External binary assets: Cloudinary or equivalent object storage

## Current Truth

- Civis does not yet ship an automated backup job from inside this repository.
- Backup execution currently depends on the managed database provider or external ops automation.
- Restore drills must be performed outside the application runtime using infrastructure access.

## Baseline Backup Approach

### Database

Preferred options:

1. Managed Postgres snapshots/backups from the hosting provider
2. Scheduled logical dumps using `pg_dump`
3. Separate retention for production and staging

Example logical backup command:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --file ./backups/civis-$(date +%F).dump
```

Requirements:

- `DATABASE_URL` must point to the correct environment
- backup output must be encrypted at rest by your storage policy
- backups must not be committed to git
- access to backup files must be restricted to authorized operators only

### Upload/Object Storage

- If Cloudinary is used, enable provider-side backup/versioning where available
- Export or snapshot critical media metadata from the app database
- Keep a documented process for restoring both the DB records and the external media references together

## Restore Test Procedure

Run restore drills against a non-production environment only.

1. Provision a clean Postgres target
2. Restore the most recent backup
3. Run Prisma generate and required migrations carefully
4. Start the app against the restored database
5. Verify:
   - orgs and users are present
   - founder super-admin still resolves correctly
   - auth works
   - admin pages load
   - CRM/accounting/HR/project/inventory counts match expectations
   - audit records and billing metadata are intact
6. Record:
   - backup timestamp
   - restore start/end time
   - issues found
   - remediation owner

## RPO / RTO Assumptions

Current working targets until stricter ops SLOs are adopted:

- RPO: 24 hours maximum acceptable data loss
- RTO: 4 hours maximum acceptable recovery time for the first stable restore

These are operational targets, not guarantees. Tighten them before enterprise rollout.

## Monthly Restore-Drill Checklist

- Confirm the latest backup exists
- Confirm backup retention policy is still active
- Restore into a non-production database
- Run app-level smoke checks
- Validate privileged login and workspace access
- Validate one export path and one upload path
- Validate audit logs and billing metadata integrity
- Record timing against RPO/RTO targets
- Create remediation tickets for any failure

## Operational Warnings

- Never run restore drills against the live production database
- Never rely on a single provider screenshot or UI badge as proof of backup validity
- If billing later becomes revenue-critical, include payment-webhook reconciliation in restore drills
