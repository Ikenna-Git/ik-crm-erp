# Founder Demo Script

Date: 2026-06-19
Audience: Founder demos, investor walkthroughs, serious customer previews
Length: 7 to 10 minutes
Branch: `p0-fix-privacy-pin-and-launch-readiness-sweep`

## Demo Path
1. Landing page
2. Pricing honesty
3. Login
4. Dashboard + Civis Pulse
5. Setup centre
6. Civis Guide command: `what should I do next?`
7. CRM contact/company/deal flow
8. Sales pipeline
9. Accounting approval workflow
10. Operations approvals
11. HR privacy PIN
12. Accounting privacy PIN
13. Admin Launch Readiness centre
14. Marketing preview-only explanation
15. Trust / status close

## What To Say At Each Step

### 1. Landing page
- “Civis is the governed workspace where CRM, finance, people, projects, inventory, approvals, and AI guidance live together.”
- “This is not a stitched-together admin bundle. The product story and the control model match.”

### 2. Pricing honesty
- “Pricing is public and honest. We are not overclaiming live self-serve billing until provider validation is complete.”

### 3. Login
- “We always enter through the real app, not a static mock.”

### 4. Dashboard + Civis Pulse
- “Civis Pulse highlights real blockers, not fabricated AI confidence.”
- “If data is thin, the product says so.”

### 5. Setup centre
- “This page shows what the app can actually verify. We removed fake completion patterns.”
- “Deployment-level provider work stays clearly blocked or action required for workspace users.”

### 6. Civis Guide
- Use: `what should I do next?`
- “Civis Guide is deterministic and role-aware before any provider-backed generation.”

### 7. CRM flow
- Create or show a contact, company, and deal.
- “CRM persistence matters because the rest of the workspace depends on real operating state.”

### 8. Sales pipeline
- “Pipeline context should connect to tasks, approvals, and invoicing without losing the org boundary.”

### 9. Accounting approval workflow
- “Approval actions persist on the server. We do not rely on cosmetic client-side status changes.”

### 10. Operations approvals
- “Operations is where work gets finalized, not where state goes to look busy.”

### 11. HR privacy PIN
- “Sensitive HR data is privacy locked by default.”
- “Role permissions are the real boundary. The PIN is an extra operational safeguard for the current session.”
- “Limited does not mean broken here. It means the feature exists, but launch-window evidence is still pending.”

### 12. Accounting privacy PIN
- “Accounting stays privacy locked separately from HR.”
- “Unlocking one sensitive module does not unlock the other.”

### 13. Admin Launch Readiness centre
- “This is where founder-level launch decisions happen.”
- “Configured does not mean proven. Missing evidence stays visible.”
- “Action Required means we still need manual proof before launch approval. Missing means required configuration is absent. Preview Only means we are not pretending this release is production-ready there.”

### 14. Marketing preview-only explanation
- “Marketing is visible because it is part of the roadmap, but it stays preview-only in this release.”

### 15. Trust / status close
- “Civis is being launched with discipline: real flows are real, missing pieces are disclosed, and the control model is explicit.”

## What Not To Say
- Do not say “fully automated”
- Do not say “enterprise compliant” unless there is evidence
- Do not say “live billing” unless Stripe is validated live
- Do not say “AI agent does everything”
- Do not present sample data as real customer proof

## Fallbacks

### If provider config is missing
- “This feature is configuration-aware. Civis will fail clearly instead of pretending success.”

### If data is empty
- “The platform is honest when a workspace has not been seeded yet. That is better than fake insight.”

### If billing is not live
- “Billing remains intentionally out of the launch promise until Stripe validation is completed.”

### If backup / restore evidence is still blocked
- “Go-live approval waits for trust evidence. Demo readiness is not the same as production sign-off.”

## What Not To Demo Yet
- Public self-serve checkout as if it is validated live
- Marketing as if it can send real campaigns
- Backup / restore as if already proven
- Any provider-backed flow you have not validated on the deployed environment
