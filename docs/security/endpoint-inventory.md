# Civis API Endpoint Inventory + Risk Matrix

Generated from `app/api/**/route.ts` in this repo.

Legend:
- Auth type (current): `public`, `session user`, `session admin`, `access-code public`
- Risk: `Low`, `Medium`, `High`, `Critical`

## 1) Auth & Platform

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/auth/[...nextauth]` | GET, POST | public (NextAuth managed) | provider callbacks, credentials | session, provider data, errors | user identity/session | anonymous + logged-in | High |
| `/api/health/db` | GET | public | none | `{ ok, hasDatabaseUrl, reason? }` | infra health metadata | anyone | Medium |
| `/api/app/bootstrap` | GET | public (current) | none | org + contacts/companies/deals/tasks/invoices/expenses | CRM + finance + task data | anyone (current) | **Critical** |

## 2) User/Admin Settings & Audit

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/user/settings` | GET, PATCH | session user (via request-user helper) | `profile`, `preferences`, `notifications`, `kpis`, `digest`, `onboarding`, `crmViews` | normalized profile/settings payload | user profile, notification settings | authenticated user | High |
| `/api/settings` | GET, PATCH, POST | session admin | `name/theme/notifyEmail`, `name/email/role` | org + users, created user | org config, role assignment | admin/super-admin | High |
| `/api/admin/users` | GET, PATCH | session admin + super-admin checks | `id`, `role` | user list/update result | roles, user directory | admin/super-admin | High |
| `/api/audit` | GET, POST | GET: session admin, POST: session user | `action`, `entity`, `entityId`, `metadata` | logs/log record | audit trail integrity | authenticated users/admins | High |

## 3) CRM

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/crm/contacts` | GET, POST, PATCH, DELETE | session user | `name,email,phone,company,status,revenue,lastContact,tags,ownerId,notes,customFields` | contact(s) | PII + sales metadata | authenticated user | High |
| `/api/crm/companies` | GET, POST, PATCH, DELETE | session user | `name,industry,size,ownerId,customFields` | company(ies) | org account data | authenticated user | Medium |
| `/api/crm/deals` | GET, POST, PATCH, DELETE | session user | `title,value,stage,company/companyId,contactId,ownerId,expectedClose,customFields` | deal(s) | pipeline financial values | authenticated user | High |
| `/api/crm/fields` | GET, POST, PATCH, DELETE | session user | field schema (`entity,name,key,type,options,required,archived,order`) | field defs | dynamic schema metadata | authenticated user | High |
| `/api/crm/followups` | GET, POST | session user | generation options (auto followups) | generated/created tasks | contact + deal activity context | authenticated user | Medium |

## 4) Accounting & Reports

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/accounting/invoices` | GET, POST, PATCH, DELETE | session user | `invoiceNumber,clientName,amount,status,dueDate,issueDate,id` | invoice(s) | financial records | authenticated user | High |
| `/api/accounting/expenses` | GET, POST, PATCH, DELETE | session user | `description,amount,category,date,status,submittedBy,id` | expense(s) | financial records | authenticated user | High |
| `/api/reports/summary` | GET | session user | `type` query (`accounting/crm/vat`) | summary object | aggregated business metrics | authenticated user | Medium |
| `/api/reports/export` | POST | public (current) | `type,target,email` | CSV attachment or send status | report data export + email target | anyone (current) | **Critical** |
| `/api/reports/digest` | POST | session user | `email,sendNow` | digest send result | KPI and business summary | authenticated user | High |

## 5) HR / Tasks / Ops

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/tasks` | GET, POST, PATCH | public (current) | `title,dueDate,ownerId,relatedType,relatedId,id,status` | task(s) | work planning + ownership | anyone (current) | **Critical** |
| `/api/ops/command` | GET | session user | none | ops stats, decisions, activity | operational + financial summary | authenticated user | High |
| `/api/ops/workflows` | GET, POST, PATCH | session user | `name,trigger,action,id,active` | workflows | automation definitions | authenticated user | High |
| `/api/playbooks` | GET, POST, PATCH | session user | `templateId,name,category,notes,id,status,progress` | playbook runs | process and execution history | authenticated user | Medium |
| `/api/decision-trails` | GET | session user | none | change trail records | action history, evidence | authenticated user | High |
| `/api/decision-trails/rollback` | POST | session admin | `id` | rollback result | destructive change capability | admin/super-admin | **Critical** |

## 6) Notifications, Docs, Gallery, Uploads

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/notifications` | GET, POST, PATCH | session user (with dev fallback) | `title,description,type,deliverEmail,source,channel,id,markAll,clear` | notifications + email status | user alerts + email channel | authenticated user | Medium |
| `/api/docs` | GET, POST, PATCH, DELETE | session user | `title,content,category,mediaUrl,id` | docs | internal docs and links | authenticated user | Medium |
| `/api/gallery` | GET, POST, PATCH, DELETE | session user | `title,description,url,mediaType,size,id` | gallery items | media metadata | authenticated user | Medium |
| `/api/uploads/cloudinary` | POST | public (current) | multipart `file`, optional `folder` | uploaded URL/meta | storage abuse vector | anyone (current) | **Critical** |

## 7) Client Portal

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/portal` | GET, POST, PATCH | session user | `name,contactName,contactEmail,summary,id,status` | portal records | client identity + status | authenticated user | High |
| `/api/portal/updates` | GET, POST | session user | `portalId,title,message,status` | updates list/create | client comms + statuses | authenticated user | Medium |
| `/api/portal/documents` | GET, POST | session user | `portalId,title,url,fileType,bytes` | document list/create | shared docs metadata | authenticated user | High |
| `/api/portal/{code}` | GET | access-code public | URL param `code` | portal details + updates + docs | client-facing project details | anyone with code | High |
| `/api/portal/{code}/approvals` | POST | access-code public | `updateId,decision,actorName` + code | approval update status | approval workflow state | anyone with code | High |

## 8) Webhooks & AI

| Endpoint | Methods | Auth (Current) | Request Fields | Response Fields | Sensitive Data | Who Can Call | Risk |
|---|---|---|---|---|---|---|---|
| `/api/webhooks` | GET, POST, PATCH | session user | `name,url,events,id,active` | webhook config incl secret on create | outbound integration secrets | authenticated user | High |
| `/api/ai/chat` | POST | session user (fallback behavior exists) | `messages,mode,provider,context` | AI message + optional actions | org metrics, conversational context | authenticated user | High |

---

## Priority Fixes From This Matrix

1. Lock down currently public business endpoints immediately:
- `/api/tasks`
- `/api/app/bootstrap`
- `/api/reports/export`
- `/api/uploads/cloudinary`

2. Remove/strictly gate header-based identity fallback (`x-user-email`) outside local dev.

3. Add endpoint-level authorization policy docs per module (USER vs ADMIN vs SUPER_ADMIN).

4. Add rate limiting to:
- public portal code endpoints
- auth endpoints
- upload and report export routes

