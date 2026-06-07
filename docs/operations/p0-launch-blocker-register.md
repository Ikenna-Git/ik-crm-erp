# P0 Launch Blocker Register

Date: 2026-06-07

| Blocker | Surface | Status | Fix / decision | Remaining evidence |
| --- | --- | --- | --- | --- |
| HR privacy lock incomplete | HR tables + dialog + APIs | Fixed in code | Session-scoped HR PIN restored; locked state now blocks details, row actions, and sensitive API payloads | Live unlock / relock evidence |
| Accounting privacy lock incomplete | Accounting tables + dialog + APIs | Fixed in code | Session-scoped Accounting PIN restored; locked state now blocks details, row actions, exports, and sensitive API payloads | Live unlock / relock evidence |
| AI routing to Overview incorrectly | AI assistant | Fixed in code | Added deterministic command router before provider fallback | Live Render command recheck |
| AI logout command missing | AI assistant | Fixed in code | Added real logout action path | Live recheck |
| Generic AI product voice | AI assistant | Fixed in code | Reframed assistant as Civis Guide with clearer action-first guidance | Live tone / command recheck |
| Marketing looked actionable without backend | Marketing | Fixed in code | Module kept preview-only and labelled as sample/preview | Browser review after redeploy |
| Landing first impression not differentiated enough | Public landing | Fixed in code | Premium landing story, FAQ, calmer CTA, and stronger trust framing added | Live responsive review |
| Backup evidence missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Restore drill missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Fake-data review missing | Founder trust | Open | Honest warning retained | Real evidence required |
| Provider-backed flow validation | AI / SMTP / Cloudinary / Stripe / Upstash | Open | No fake success; manual validation still required | Real evidence required |
