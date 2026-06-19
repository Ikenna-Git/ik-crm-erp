# Live Evidence Capture Guide

Date: 2026-06-19
Branch: `p0-permanent-admin-centre-privacy-pins-and-motion-performance`

Use this guide after redeploy. Do not mark any item complete without the actual result and evidence note.

## How To Record Evidence
- Role/account used
- Exact route or command
- Expected result
- Actual result
- Pass / Fail / Blocked
- Screenshot or note
- Date
- Owner

## Smoke Test
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BASE_URL=https://ik-crm-erp.onrender.com P0_SMOKE_DEBUG=1 npm run p0:smoke` | Logged-out + optional cookies | No route-guard regression, no secret leak, clear blocked/warning states |  |  |  |  |  |

## Founder Admin Checks
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Founder | Admin ops center loads |  |  |  |  |  |
| `/admin/system` | Founder | Founder Desk loads |  |  |  |  |  |
| `/admin/launch-readiness` | Founder | Launch readiness loads with safe status sections |  |  |  |  |  |
| `/api/admin/platform-status` | Founder | JSON contains safe statuses only |  |  |  |  |  |

## Org Owner Checks
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin` | Org owner | Workspace admin center loads |  |  |  |  |  |
| `/admin/system` | Org owner | Blocked / forbidden / redirect |  |  |  |  |  |
| `/admin/launch-readiness` | Org owner | Blocked / forbidden / redirect |  |  |  |  |  |
| `/admin/users` | Org owner | Same-org users only |  |  |  |  |  |
| `/dashboard/admin` | Org owner or admin | Workspace Admin Center loads with users, privacy locks, setup, and offboarding sections |  |  |  |  |  |

## Restricted User Checks
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard/hr` | Restricted user | Redacted when locked and unauthorized |  |  |  |  |  |
| `/dashboard/accounting` | Restricted user | Redacted when locked and unauthorized |  |  |  |  |  |
| `/admin` | Restricted user | Blocked |  |  |  |  |  |

## Invite Flow
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create invite | Founder or authorized admin | Invite generated for intended org and role only |  |  |  |  |  |
| Accept invite | Invited user | Lands in invited org only |  |  |  |  |  |
| Post-login access | Invited user | No founder-only pages or cross-org users |  |  |  |  |  |

## CRM CRUD
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Create contact/company/deal | Workspace user | Saves and survives refresh |  |  |  |  |  |
| Edit contact/company/deal | Workspace user | Saves and survives refresh |  |  |  |  |  |
| Delete or archive where supported | Workspace user | Honest result with refresh proof |  |  |  |  |  |

## Accounting Approvals
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Request approval | Finance user | Creates one pending item only |  |  |  |  |  |
| Approve / reject | Ops/admin | Persists and refresh confirms final state |  |  |  |  |  |

## HR Privacy PIN
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PIN input enabled | Authorized HR role | Input is typeable when server allows unlock |  |  |  |  |  |
| Wrong PIN | Authorized HR role | Error shown, no unlock |  |  |  |  |  |
| Correct PIN | Authorized HR role | HR unlocks only |  |  |  |  |  |
| View Details while locked | Authorized HR role | Locked dialog shows protection message only |  |  |  |  |  |
| Re-lock | Authorized HR role | Details hide again |  |  |  |  |  |
| Rotate PIN | Org admin | Existing unlocked HR sessions become locked again |  |  |  |  |  |

## Accounting Privacy PIN
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PIN input enabled | Authorized finance role | Input is typeable when server allows unlock |  |  |  |  |  |
| Wrong PIN | Authorized finance role | Error shown, no unlock |  |  |  |  |  |
| Correct PIN | Authorized finance role | Accounting unlocks only |  |  |  |  |  |
| View Details while locked | Authorized finance role | Locked dialog shows protection message only |  |  |  |  |  |
| Re-lock | Authorized finance role | Details and exports respect lock again |  |  |  |  |  |
| Rotate PIN | Org admin | Existing unlocked Accounting sessions become locked again |  |  |  |  |  |

## Landing Performance
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` default cursor | Public | System cursor by default |  |  |  |  |  |
| `/` custom cursor opt-in | Public desktop | Custom cursor only after user selection |  |  |  |  |  |
| `/` reduced motion | Public with reduced motion | Custom cursor disabled and landing animation reduced |  |  |  |  |  |

## Civis Guide
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `take me to pricing` | Authenticated user | Opens pricing |  |  |  |  |  |
| `open gallery` | Authenticated user | Opens gallery |  |  |  |  |  |
| `what should I do next?` | Authenticated user | Gives honest, role-aware guidance |  |  |  |  |  |
| `unlock accounting` | Authenticated user | Responds honestly without bypassing lock |  |  |  |  |  |

## Provider Diagnostics
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/admin/launch-readiness` provider section | Founder | Configured / partial / missing only, no secret values |  |  |  |  |  |
| SMTP live check | Founder | Email sends or fails honestly |  |  |  |  |  |
| Cloudinary live check | Founder | Upload succeeds or fails honestly |  |  |  |  |  |
| Stripe live/test decision | Founder | Scope is clear and honest |  |  |  |  |  |

## Backup / Restore / Fake Data
| Test | Role | Expected result | Actual result | Pass / Fail / Blocked | Screenshot / note | Date | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backup evidence | Founder | Latest backup proof attached |  |  |  |  |  |
| Restore drill | Founder | Latest restore proof attached |  |  |  |  |  |
| Fake-data review | Founder | Demo/sample records reviewed and labeled honestly |  |  |  |  |  |
