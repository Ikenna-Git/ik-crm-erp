# Top 0.1 Percent Roadmap

Date: 2026-06-07  
Branch: `p0-launch-ux-world-class-sweep`

## Immediate Launch Bar

1. Finish every live validation item still marked blocked in the operations runbooks.
2. Keep all non-persisted or provider-dependent features explicitly honest in UI copy and action states.
3. Maintain server-side enforcement for route guards, exports, approvals, and admin/org boundaries.

## Next 30 Days

1. Add browser-driven role regression coverage for:
   - founder vs org owner vs normal user
   - invite acceptance and role/org attachment
   - accounting approval request/approve/reject after refresh
2. Add a shared restricted-state pattern for modules that are visible but not manageable.
3. Add admin diagnostics for provider status:
   - SMTP
   - Cloudinary
   - Upstash
   - AI providers
   - Stripe
4. Remove remaining preview-only module ambiguity:
   - marketing campaigns
   - advanced operations integrations
   - any disabled billing action

## Next 60 Days

1. Ship true marketing persistence and campaign delivery.
2. Ship validated self-serve billing with test/live evidence and webhook resilience.
3. Add fine-grained redacted summary modes for HR and Accounting instead of all-or-nothing manage access.
4. Add richer audit trails and user-facing “last updated by / last synced” feedback across critical records.

## Next 90 Days

1. Complete design-system polish:
   - consistent dialog/sheet sizing and scroll behavior
   - stronger empty/error/loading states
   - tighter visual hierarchy across dashboard modules
2. Add automated release scorecards generated from smoke + browser evidence.
3. Add recovery/operator flows for failed imports, provider outages, and permission denials.

## Product Standard To Hold

- No fake success.
- No client-only trust for business-critical state.
- No hidden role escalation.
- No preview-only action that looks like a real saved mutation.
- No launch claim without evidence.
