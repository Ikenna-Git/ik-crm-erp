# Stripe Staging Validation Checklist

Updated: 2026-05-07

Use this checklist before declaring Stripe billing ready for Civis.

## 1. Required env vars

These must be set in staging before any checkout or webhook validation:

- `BILLING_PROVIDER_DEFAULT=stripe` or an org `paymentProvider` set to `stripe`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- one or more plan price IDs:
  - `STRIPE_PRICE_STARTER_MONTHLY`
  - `STRIPE_PRICE_STARTER_QUARTERLY`
  - `STRIPE_PRICE_STARTER_ANNUAL`
  - `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
  - `STRIPE_PRICE_PROFESSIONAL_QUARTERLY`
  - `STRIPE_PRICE_PROFESSIONAL_ANNUAL`
  - `STRIPE_PRICE_ENTERPRISE_MONTHLY`
  - `STRIPE_PRICE_ENTERPRISE_QUARTERLY`
  - `STRIPE_PRICE_ENTERPRISE_ANNUAL`

## 2. Stripe dashboard setup

- Create products/plans in Stripe test mode for every plan/cycle you intend to sell
- Copy each test-mode Price ID into the matching `STRIPE_PRICE_*` env var
- Register the staging webhook endpoint:
  - `https://<staging-domain>/api/billing/webhook`
- Add the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 3. Required webhook events

Subscribe the staging webhook to at least:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

If Stripe test clocks or trial handling are used, also include:

- `customer.subscription.trial_will_end`

## 4. Test product and price mapping

For each sellable plan:

1. Create the product in Stripe test mode
2. Create monthly/quarterly/annual prices as needed
3. Copy the Stripe Price ID
4. Map it to the matching env var in staging
5. Redeploy or restart staging so the env is loaded

## 5. Checkout validation

1. Sign in as an `ORG_OWNER` or founder `SUPER_ADMIN`
2. Open `/admin/billing`
3. Confirm provider readiness no longer says Stripe is missing
4. Call `POST /api/billing/checkout` through the UI or API
5. Expected result:
   - returns a Stripe-hosted redirect URL
   - creates a Stripe checkout session
   - writes audit/security logs for the checkout request

If the route returns `503` with a configuration message, env or price setup is still incomplete.

## 6. Webhook validation

1. Complete a Stripe test checkout
2. Confirm Stripe delivers the webhook successfully
3. Inspect app logs and admin billing UI
4. Confirm:
   - webhook was accepted
   - event signature verification passed
   - `Org.billingStatus` updated correctly
   - `Org.paymentCustomerRef` and `Org.paymentSubscriptionRef` are populated when applicable
   - `nextBillingDate` and `trialEndsAt` update when the event payload includes them

## 7. Failure-path validation

### Payment failed

- Trigger a failed payment in Stripe test mode
- Confirm webhook processing changes org billing state to `past_due` or equivalent failure state
- Confirm gated features fail closed
- Confirm billing/admin/security logs capture the failure without logging secrets

### Subscription cancellation

- Cancel the test subscription in Stripe
- Confirm webhook processing changes org billing state to `canceled`
- Confirm paid/gated features fail closed after the cancellation state is applied

### Trial end / past due

- If using Stripe trials or test clocks, simulate trial expiry
- Confirm the org transitions out of usable trial state
- Confirm the platform blocks paid features once the trial has genuinely expired

## 8. Expected logs and audit evidence

Look for:

- audit entry for `billing.checkout.requested`
- audit entries for webhook lifecycle actions applied to the org
- security/observability log for webhook failures or invalid signatures
- no secrets, raw card data, tokens, or signing secrets in logs

## 9. Staging answer

Stripe is only staging-ready when all of the following are true:

- env vars are present
- price IDs are mapped
- checkout works
- webhook signature verification works
- org billing status changes correctly
- failure paths were tested
- logs and audit evidence were reviewed

Until then, Civis billing must still be treated as not live.
