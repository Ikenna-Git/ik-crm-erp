# P0 Launch Blocker Register

Date: 2026-06-07

| Blocker | Surface | Status | Fix / decision | Remaining evidence |
| --- | --- | --- | --- | --- |
| Locked HR details leak | HR tables + dialog + APIs | Fixed in code | Restricted users now get redacted API payloads and cannot expose row details through the dialog path | Live restricted-user recheck |
| Locked Accounting details leak | Accounting tables + dialog + APIs | Fixed in code | Restricted users now get redacted invoice / expense API payloads and no detail-action path | Live restricted-user recheck |
| AI routing to Overview incorrectly | AI assistant | Fixed in code | Added deterministic command router before provider fallback | Live Render command recheck |
| AI logout command missing | AI assistant | Fixed in code | Added real logout action path | Live recheck |
| Marketing looked actionable without backend | Marketing | Fixed in code | Module kept preview-only and labelled as sample/preview | Browser review after redeploy |
| Backup evidence missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Restore drill missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Fake-data review missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Provider-backed flow validation | AI / SMTP / Cloudinary / Stripe / Upstash | Open | No fake success; manual validation still required | Real evidence required |
