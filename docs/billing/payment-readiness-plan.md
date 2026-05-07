# Civis Payment Readiness Plan

Updated: 2026-05-07

This is the honest billing/payment state for Civis after the production-readiness pass.

## Current State

- Public pricing page exists
- Org billing metadata exists in Prisma
- Admin billing settings page exists
- Billing readiness helpers exist in code
- Plan-aware feature helper now exists in code
- Provider-agnostic billing foundation exists in code
- Stripe checkout route exists in code
- Stripe webhook verification and lifecycle handlers exist in code
- Live payments are still **not enabled** until provider credentials, price IDs, webhook secret, and production testing are completed

## Provider Readiness Detected In Code

The current code checks for these providers:

- Paystack
- Flutterwave
- Stripe

Current readiness now has two layers:

- env detection for Paystack / Flutterwave / Stripe
- implemented runtime adapter only for Stripe in this branch

Paystack and Flutterwave remain placeholders until their adapters are explicitly implemented.

Required env pairs for detection:

- Paystack:
  - `PAYSTACK_SECRET_KEY`
  - `PAYSTACK_PUBLIC_KEY`
- Flutterwave:
  - `FLUTTERWAVE_SECRET_KEY`
  - `FLUTTERWAVE_PUBLIC_KEY`
- Stripe:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - plan price IDs such as:
    - `STRIPE_PRICE_STARTER_MONTHLY`
    - `STRIPE_PRICE_PROFESSIONAL_MONTHLY`
    - `STRIPE_PRICE_ENTERPRISE_MONTHLY`

## Existing Billing Model

Current Org fields already support billing metadata:

- `billingPlan`
- `billingStatus`
- `billingCycle`
- `billingEmail`
- `seatLimit`
- `nextBillingDate`
- `trialEndsAt`
- `paymentProvider`
- `paymentCustomerRef`
- `paymentSubscriptionRef`

This is now a usable lifecycle foundation, not yet a production-proven commercial system.

## Current Runtime Foundation

Implemented in code:

- `GET /api/billing/status`
- `POST /api/billing/checkout`
- `POST /api/billing/webhook`
- provider runtime summary helpers
- Stripe checkout session creation abstraction
- Stripe webhook signature verification abstraction
- normalized subscription lifecycle event handler
- org billing-state updates from verified webhook events
- audit logging for checkout requests and billing lifecycle events
- server-side feature gating helpers
- seat-limit enforcement during user invitation

Still required before calling payments live:

- real Stripe test-mode validation in staging
- production webhook endpoint registration at the provider
- price IDs configured for the plans/cycles you want to sell
- customer email / billing-contact validation flow
- receipt / invoice and customer billing-history UX

## What Is Still Missing

### Required server routes

- checkout/session creation route: now present
- billing provider webhook route: now present
- customer billing portal or equivalent management route: still missing
- subscription sync/reconciliation route or background job: still missing

### Required lifecycle handling

- create customer at provider: implemented for Stripe
- create checkout/subscription: implemented for Stripe
- receive webhook events: implemented for Stripe
- verify webhook signatures: implemented for Stripe
- update org billing status safely: implemented
- update trial expiry: implemented in lifecycle handler
- record payment failures: implemented
- suspend or downgrade safely when required: partial

### Required product behavior

- enforce plan gating server-side for paid features: expanded
- seat-limit enforcement flow: implemented for user invitation
- org-owner billing UI for plan status and next bill date: present
- invoice/receipt handling: still missing for subscription billing
- billing failure messaging: partial

## Plan Gating Status

Plan gating is now **broader but still partial**.

Implemented:

- centralized feature helper in `lib/billing.ts`
- server-side gating for:
  - core CRM/accounting/portal/projects/HR/inventory access by billing status
  - AI access by billing status
  - report exports by plan and billing status
  - uploads by plan and billing status
  - webhook management by plan and billing status
  - playbooks/workflows by plan and billing status
  - team/user management by plan and billing status
- safe failure for paid/gated features when billing is suspended, canceled, past due, or the trial has expired

Still missing:

- full gating across every low-risk/read-only UI surface
- richer entitlement breakdown for analytics tiers and future add-ons
- customer billing portal / self-serve plan changes

## Recommended Implementation Order

1. Choose the first live provider path
   - Stripe is the only implemented runtime adapter in this branch
2. Configure Stripe envs and price IDs in staging
3. Register the staging webhook secret and endpoint
4. Run success / failure / cancel / past-due / expired-trial smoke tests
5. Add customer billing portal and reconciliation job
6. Add receipts/invoices/customer billing history
7. Extend plan entitlements where business wants monetization boundaries

## Trial Handling

Current fields support:

- `trial` plan
- `trial` billing status
- `trialEndsAt`

Still required:

- explicit downgrade/lock policy after expiry
- visible org-owner messaging for trial state in more surfaces
- optional reminder notifications before expiry

## Admin Billing Controls

Current admin billing controls can:

- view billing metadata
- update billing metadata
- show provider readiness
- show whether checkout/webhooks are implemented
- show selected provider and missing billing config

Current admin billing controls cannot:

- charge a card manually from the UI
- expose customer self-serve billing history
- reconcile provider events outside webhook-driven updates

## Test Mode Checklist For Later

Before turning on live charging, verify:

1. test credentials in non-production only
2. provider webhook secret in staging
3. test price IDs for each sellable plan/cycle
4. success payment flow
5. failed payment flow
6. canceled subscription flow
7. webhook replay safety test
8. seat upgrade/downgrade test

## Production Answer

Billing is currently:

- pricing preview: yes
- billing metadata/settings: yes
- checkout/webhook foundation: yes
- live payment flow enabled in production: no
- full plan gating: partial
