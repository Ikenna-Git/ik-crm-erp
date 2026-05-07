# Civis Fake-Data Review Workflow

Updated: 2026-05-07

Use the fake-data review script to inspect a single organization safely before deleting anything.

## Safe report-only mode

```bash
npm run fake-data:review -- --org <orgId> --report-only --out /tmp/fake-data-report.json
```

What this does:

- scopes review to one org
- does not delete records
- exports a JSON report for manual review

This is the recommended org-scoped dry-run before any cleanup decision.

## Review suspected records

The report contains:

- `confirmed`
- `suspected`

Rules:

- confirmed demo markers are candidates for cleanup
- suspected records require human review
- suspected records must not be deleted blindly

## Include suspected records in analysis

```bash
npm run fake-data:review -- --org <orgId> --report-only --include-suspected --out /tmp/fake-data-report.json
```

This is still non-destructive. It only widens the report.

## Exporting the report

Choose any writable file path for `--out`, for example:

```bash
npm run fake-data:review -- --org <orgId> --report-only --out /tmp/civis-fake-data-report.json
```

## Destructive mode

Only run after explicit approval and report review:

```bash
npm run fake-data:review -- --org <orgId> --delete --confirm-delete DELETE_DEMO_DATA
```

Safety rules:

- `--org` is required
- `--delete` is required
- `--confirm-delete DELETE_DEMO_DATA` is required
- suspected-only records are not deleted unless you explicitly included them in the prior review workflow

## If the database is unreachable

The script now prints remediation steps automatically.

Common fixes:

1. verify `DATABASE_URL`
2. use the direct Postgres connection string for admin/maintenance tasks
3. confirm the DB is running and reachable from the machine executing the script
4. rerun report-only mode first

## Recommendation

- run against staging or a production clone first
- export the report
- review with the owner
- only then consider destructive cleanup
