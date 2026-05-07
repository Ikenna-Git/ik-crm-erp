# Civis Payment Readiness Plan

Updated: 2026-05-06

This is the honest billing/payment state for Civis after the production-readiness pass.

## Current State

- Public pricing page exists
- Org billing metadata exists in Prisma
- Admin billing settings page exists
- Billing readiness helpers exist in code
- Plan-aware feature helper now exists in code
- Live checkout is **not** implemented
- Payment webhooks are **not** implemented
- Subscription lifecycle automation is **not** implemented

## Provider Readiness Detected In Code

The current code checks for these providers:

- Paystack
- Flutterwave
- Stripe

Current readiness depends on env presence only, not on a live integration flow.

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

This is a usable metadata foundation, not a complete commercial system.

## What Is Still Missing

### Required server routes

- checkout/session creation route
- billing provider webhook route
- customer billing portal or equivalent management route
- subscription sync/reconciliation route or background job

### Required lifecycle handling

- create customer at provider
- create checkout/subscription
- receive webhook events
- verify webhook signatures
- update org billing status safely
- update trial expiry
- record payment failures
- suspend or downgrade safely when required

### Required product behavior

- enforce plan gating server-side for paid features
- seat-limit enforcement flow
- org-owner billing UI for plan status and next bill date
- invoice/receipt handling
- billing failure messaging

## Plan Gating Status

Plan gating is now **partial**.

Implemented:

- centralized feature helper in `lib/billing.ts`
- server-side gating for:
  - billing settings access by plan
  - webhook management by plan
  - email report exports by plan

Still missing:

- broad gating across the rest of the paid feature surface
- checkout-driven entitlement updates
- self-serve subscription lifecycle

## Recommended Implementation Order

1. Choose one provider first
   - recommended: Stripe or Paystack
2. Add checkout/session route
3. Add verified webhook route
4. Update org billing state from webhooks only
5. Add plan/entitlement enforcement to sensitive paid features
6. Add receipts/invoices/customer billing history
7. Add cancellation, past-due, and suspension handling

## Trial Handling

Current fields support:

- `trial` plan
- `trial` billing status
- `trialEndsAt`

Still required:

- automatic trial-expiry evaluation
- plan downgrade/lock policy after expiry
- visible org-owner messaging for trial state

## Admin Billing Controls

Current admin billing controls can:

- view billing metadata
- update billing metadata
- show provider readiness
- show whether checkout/webhooks are implemented

Current admin billing controls cannot:

- charge a card
- create a live subscription
- reconcile provider events automatically

## Test Mode Checklist For Later

When a provider is chosen, add:

1. test credentials in non-production only
2. provider webhook secret in staging
3. test card/account scenarios
4. success payment flow
5. failed payment flow
6. canceled subscription flow
7. webhook replay safety test
8. seat upgrade/downgrade test

## Production Answer

Billing is currently:

- pricing preview: yes
- billing metadata/settings: yes
- live payment flow: no
- full plan gating: partial
