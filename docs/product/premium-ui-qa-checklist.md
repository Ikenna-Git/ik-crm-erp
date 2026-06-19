# Premium UI QA Checklist

Date: 2026-06-07

| Page | Viewport | Visual issue | Action taken | Remaining concern | Pass / Fail | Screenshot / evidence note |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | 1440px | Premium hierarchy, spacing, CTA flow | Landing story + FAQ + tighter hero/header/footer copy; system cursor default and motion load reduced | Needs live browser pass | Pending | Capture full-page view after redeploy |
| Pricing | 1440px | Pricing honesty and CTA clarity | Kept pricing honest and sign-up focused | Needs mobile review | Pending | Verify CTA text after redeploy |
| Dashboard | 1440px | First-impression clarity | Added stronger launch setup path and blocker copy | Needs live role-based review | Pending | Verify Civis Pulse on live data |
| Sidebar | 1280px | Navigation grouping and active state clarity | Grouped navigation and marked privacy-lock modules | Needs collapsed-state review if applicable | Pending | Capture active states |
| AI assistant | 1280px | Product voice and helper prompts | Reframed as Civis Guide with clearer prompts | Needs live provider / no-provider check | Pending | Test deterministic commands |
| CRM | 1024px | Empty-state and route clarity | Existing route retained | Needs browser QA | Pending | Check no overflow |
| Accounting | 1024px | Privacy lock and row-action safety | Restored session lock flow and locked-state messaging | Needs live unlock test | Pending | Verify locked/unlocked states |
| HR | 1024px | Privacy lock and payroll detail redaction | Restored session lock flow and locked-state messaging | Needs live unlock test | Pending | Verify locked/unlocked states |
| Marketing | 1024px | Honesty of preview-only state | Kept preview framing | Needs copy review in browser | Pending | Capture preview state |
| Workspace Admin Center | 1280px | Org-admin clarity and privacy controls | Added `/dashboard/admin` with privacy locks, offboarding, setup, and audit sections | Needs live founder/org-owner retest | Pending | Record blocked/allowed views |
| Record dialogs | 390px | Scroll / close / locked state | Shared dialog already hardened; lock copy updated | Needs mobile QA | Pending | Open HR + Accounting details dialogs |
| HR privacy lock | 390px | Tiny tap targets / overflow | New lock panel uses compact controls | Needs live mobile test | Pending | Test unlock + relock on mobile |
| Accounting privacy lock | 390px | Tiny tap targets / overflow | New lock panel uses compact controls | Needs live mobile test | Pending | Test unlock + relock on mobile |
