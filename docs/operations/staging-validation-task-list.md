# Staging Validation Task List

Use this list to prepare staging, collect evidence, and make the final merge/deploy decision.

## 1. Environment and database

1. Configure staging env from [.env.production.example](/Users/mac/Documents/code/.env.production.example)
2. Configure the staging database connection
3. Run Prisma migrations against staging
4. Confirm the app boots with the staging env set

## 2. Shared rate limiting and observability

1. Configure Upstash/Redis for staging
2. Set:
   - `RATE_LIMIT_STORE`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Configure observability webhooks and optional Sentry
4. Verify test security/error events are delivered

## 3. Core integrations

1. Configure SMTP
2. Configure Cloudinary
3. Configure AI keys if AI remains enabled

## 4. Stripe staging setup

1. Configure Stripe test keys
2. Configure the Stripe webhook endpoint
3. Create Stripe test products and prices
4. Map the `STRIPE_PRICE_*` env vars
5. Redeploy staging with the updated billing env

## 5. Safety and data validation

1. Run fake-data review in report-only mode
2. Export the report
3. Review confirmed and suspected records
4. Perform a backup
5. Perform a restore drill
6. Record evidence and sign-off

## 6. Smoke tests and evidence

1. Run the smoke tests in [production-smoke-tests.md](/Users/mac/Documents/code/docs/operations/production-smoke-tests.md)
2. Record pass/fail evidence for each major area
3. Validate Stripe checkout/webhook behaviour in staging
4. Validate rate limiting behaviour in staging
5. Validate observability logging in staging

## 7. Release decision

1. Review the remaining moderate advisories
2. Decide whether to risk-accept or hold release
3. Review [go-live-decision.md](/Users/mac/Documents/code/docs/operations/go-live-decision.md)
4. Decide merge or no-merge
5. Decide deploy or no-deploy
