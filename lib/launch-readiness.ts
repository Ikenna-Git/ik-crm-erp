import { canViewFounderControls } from "@/lib/authz"

export type LaunchStatus =
  | "ready"
  | "limited"
  | "preview-only"
  | "blocked"
  | "action-required"
  | "optional"
  | "configured"
  | "partial"
  | "missing"
  | "disabled"
  | "test"

export type ReadinessItem = {
  id: string
  label: string
  status: LaunchStatus
  reason: string
  nextAction: string
  evidenceNote?: string
  href?: string
}

type ProviderDiagnostic = ReadinessItem & {
  feature: string
}

type LaunchContext = {
  role?: string | null
  email?: string | null
  dbConnected?: boolean
  inviteCount?: number
  orgName?: string | null
  logoUrl?: string | null
  industry?: string | null
  operatingTemplate?: string | null
  legalBusinessName?: string | null
  businessAddress?: string | null
  businessEmail?: string | null
  defaultInvoiceTerms?: string | null
  defaultInvoiceNotes?: string | null
  orgStatus?: string | null
  counts?: Partial<Record<string, number>>
}

const hasAny = (...values: Array<string | undefined>) => values.some((value) => Boolean(value && value.trim()))
const hasAll = (...values: Array<string | undefined>) => values.every((value) => Boolean(value && value.trim()))

const classifyGroup = (keys: Array<string | undefined>) => {
  const filled = keys.filter((value) => Boolean(value && value.trim())).length
  if (filled === 0) return "missing" as const
  if (filled === keys.length) return "configured" as const
  return "partial" as const
}

export function getProviderDiagnostics(): ProviderDiagnostic[] {
  const smtpStatus = classifyGroup([
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
    process.env.SMTP_FROM,
  ])
  const cloudinaryStatus = classifyGroup([
    process.env.CLOUDINARY_CLOUD_NAME,
    process.env.CLOUDINARY_API_KEY,
    process.env.CLOUDINARY_API_SECRET,
  ])
  const rateLimitStore = (process.env.RATE_LIMIT_STORE || "").trim().toLowerCase()
  const upstashGroup = classifyGroup([process.env.UPSTASH_REDIS_REST_URL, process.env.UPSTASH_REDIS_REST_TOKEN])
  const upstashStatus =
    rateLimitStore === "disabled"
      ? "disabled"
      : rateLimitStore === "memory" || rateLimitStore === "local"
        ? "limited"
        : upstashGroup === "configured"
          ? "configured"
          : upstashGroup
  const aiProvider = (process.env.AI_PROVIDER || "").trim().toLowerCase()
  const aiKeyCount = [
    process.env.OPENAI_API_KEY,
    process.env.ANTHROPIC_API_KEY,
    process.env.GEMINI_API_KEY,
  ].filter((value) => Boolean(value && value.trim())).length
  const aiStatus =
    aiProvider === "disabled" || aiProvider === "off"
      ? "disabled"
      : aiProvider === "local" && aiKeyCount === 0
        ? "limited"
        : aiKeyCount > 0
          ? "configured"
          : "missing"
  const stripeSecret = process.env.STRIPE_SECRET_KEY || ""
  const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET || ""
  const stripePrices = Object.keys(process.env).filter((key) => key.startsWith("STRIPE_PRICE_") && process.env[key])
  const stripeGroup = classifyGroup([stripeSecret, stripePublishable, stripeWebhook])
  const stripeStatus =
    stripeGroup === "configured"
      ? stripeSecret.startsWith("sk_test_") || stripePublishable.startsWith("pk_test_")
        ? "test"
        : "configured"
      : stripeGroup
  const observabilityCount = [
    process.env.OBSERVABILITY_WEBHOOK_URL,
    process.env.SECURITY_EVENTS_WEBHOOK_URL,
    process.env.ERROR_ALERT_WEBHOOK_URL,
    process.env.SENTRY_DSN,
  ].filter((value) => Boolean(value && value.trim())).length
  const observabilityStatus =
    observabilityCount === 0 ? "missing" : observabilityCount >= 2 ? "configured" : "partial"

  return [
    {
      id: "database",
      label: "Database",
      feature: "Core product persistence",
      status: process.env.DATABASE_URL ? "partial" : "missing",
      reason: process.env.DATABASE_URL
        ? "DATABASE_URL is present, but live connectivity still has to be verified before persistence can be considered ready."
        : "Without DATABASE_URL, authenticated modules cannot persist real product state.",
      nextAction: process.env.DATABASE_URL
        ? "Verify Prisma connectivity and a successful database health check before sign-off."
        : "Add DATABASE_URL and verify Prisma connectivity.",
      evidenceNote: process.env.DATABASE_URL ? "Configured, connectivity evidence pending." : "Action required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "auth",
      label: "Auth URLs and secret",
      feature: "Login, invites, and session integrity",
      status: hasAll(process.env.NEXTAUTH_URL, process.env.NEXTAUTH_SECRET)
        ? "configured"
        : hasAny(process.env.NEXTAUTH_URL, process.env.NEXTAUTH_SECRET)
          ? "partial"
          : "missing",
      reason: hasAll(process.env.NEXTAUTH_URL, process.env.NEXTAUTH_SECRET)
        ? "NEXTAUTH_URL and NEXTAUTH_SECRET are present."
        : "Invite links and session handling stay fragile until auth base URL and secret are both present.",
      nextAction: "Verify login, invite acceptance, and redirect behaviour on the deployed environment.",
      evidenceNote: "Live auth validation required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "smtp",
      label: "SMTP",
      feature: "Invites, digests, and alert email delivery",
      status: smtpStatus,
      reason:
        smtpStatus === "configured"
          ? "SMTP host, port, credentials, and sender are all present."
          : smtpStatus === "partial"
            ? "SMTP is partially configured, so email delivery should be treated as unreliable."
            : "SMTP is missing, so invite and alert email delivery cannot be treated as live.",
      nextAction:
        smtpStatus === "configured"
          ? "Send a live invite or digest and capture evidence."
          : "Complete SMTP configuration, then validate one real email flow.",
      evidenceNote: smtpStatus === "configured" ? "Provider configured, evidence pending." : "Action required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "cloudinary",
      label: "Cloudinary",
      feature: "Gallery and portal uploads",
      status: cloudinaryStatus,
      reason:
        cloudinaryStatus === "configured"
          ? "Cloudinary upload credentials are present."
          : cloudinaryStatus === "partial"
            ? "Cloudinary is only partially configured, so uploads should be treated as blocked."
            : "Cloudinary is missing, so upload workflows must stay in clear setup-required mode.",
      nextAction:
        cloudinaryStatus === "configured"
          ? "Upload one real file and capture the result."
          : "Complete Cloudinary configuration before treating uploads as launch-ready.",
      evidenceNote: cloudinaryStatus === "configured" ? "Provider configured, evidence pending." : "Action required.",
      href: cloudinaryStatus === "configured" ? "/dashboard/gallery" : "/admin/launch-readiness",
    },
    {
      id: "upstash",
      label: "Rate limiting / Upstash",
      feature: "Network-safe throttling and abuse control",
      status: upstashStatus,
      reason:
        upstashStatus === "configured"
          ? "Upstash REST URL and token are present for remote rate limiting."
          : upstashStatus === "limited"
            ? "Rate limiting is not using a shared remote store, so protection is weaker outside a single runtime."
            : upstashStatus === "disabled"
              ? "Rate limiting is intentionally disabled."
              : upstashStatus === "partial"
                ? "Upstash is only partially configured."
                : "No shared rate-limit store is configured yet.",
      nextAction:
        upstashStatus === "configured"
          ? "Run one validation pass against the protected endpoints."
          : "Finish remote rate-limit configuration or document the limited mode clearly.",
      evidenceNote:
        upstashStatus === "configured" ? "Provider configured, evidence pending." : upstashStatus === "limited" ? "Warning." : "Action required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "ai",
      label: "AI provider",
      feature: "Provider-backed Civis Guide responses",
      status: aiStatus,
      reason:
        aiStatus === "configured"
          ? "At least one provider key is present."
        : aiStatus === "disabled"
            ? "Provider-backed AI is intentionally disabled."
          : aiStatus === "limited"
              ? "Civis Guide can still use local deterministic routing, but not full provider responses."
              : "No provider keys are present. Deterministic Civis Guide commands still work, but external model responses are disabled or limited.",
      nextAction:
        aiStatus === "configured"
          ? `Validate the configured provider path${aiProvider ? ` for ${aiProvider}` : ""}.`
          : "Keep Civis Guide messaging honest about deterministic-only or disabled mode.",
      evidenceNote:
        aiStatus === "configured" ? "Provider configured, evidence pending." : aiStatus === "disabled" ? "Intentional." : "Action required.",
      href: "/dashboard/ai",
    },
    {
      id: "stripe",
      label: "Stripe",
      feature: "Billing and checkout",
      status: stripeStatus,
      reason:
        stripeStatus === "test"
          ? `Stripe keys are present in test mode${stripePrices.length ? ` with ${stripePrices.length} price reference${stripePrices.length === 1 ? "" : "s"}` : ""}.`
        : stripeStatus === "configured"
            ? "Stripe appears configured with non-test keys."
          : stripeStatus === "partial"
              ? "Stripe is only partially configured, so billing must not be presented as live."
              : "Stripe is not configured. Do not imply live checkout.",
      nextAction:
        stripeStatus === "test"
          ? "Validate test checkout and webhook handling before describing billing as ready."
          : stripeStatus === "configured"
            ? "Confirm live/test mode explicitly and capture billing evidence."
          : "Keep pricing honest and avoid implying live checkout.",
      evidenceNote:
        stripeStatus === "test"
          ? "Test-configured, live evidence pending."
          : stripeStatus === "configured"
            ? "Evidence pending."
            : "Action required.",
      href: "/pricing",
    },
    {
      id: "observability",
      label: "Observability and alerts",
      feature: "Runtime monitoring and security notification paths",
      status: observabilityStatus,
      reason:
        observabilityStatus === "configured"
          ? "At least two alert or monitoring channels are configured."
        : observabilityStatus === "partial"
            ? "Only part of the monitoring/alerting stack is configured."
            : "No monitoring or alerting endpoints are configured. Runtime alerting is not fully set up.",
      nextAction:
        observabilityStatus === "configured"
          ? "Record one handled incident or alert delivery proof."
          : "Add Sentry or webhook-based alerts before broader rollout.",
      evidenceNote: observabilityStatus === "configured" ? "Provider configured, evidence pending." : "Action required.",
      href: "/admin/launch-readiness",
    },
  ]
}

export function getSecurityAccessReadiness(context: LaunchContext): ReadinessItem[] {
  const founder = canViewFounderControls(context.role, context.email)
  const hrPinConfigured = (context.counts?.hrPrivacyConfigured || 0) > 0
  const accountingPinConfigured = (context.counts?.accountingPrivacyConfigured || 0) > 0
  return [
    {
      id: "route-guards",
      label: "Protected route guards",
      status: "ready",
      reason: "Server-side route guards and live smoke evidence already show logged-out protection on protected pages and APIs.",
      nextAction: "Re-run the live smoke pack after every redeploy and attach the fresh evidence.",
      evidenceNote: "Documented smoke evidence exists for logged-out protection.",
      href: "/admin/launch-readiness",
    },
    {
      id: "org-isolation",
      label: "Org isolation",
      status: "ready",
      reason: "Server-side org scoping and founder versus workspace boundaries are in place, but fresh invite/org-owner evidence is still needed.",
      nextAction: "Re-run invite acceptance and org-owner validation after redeploy.",
      evidenceNote: "Role-boundary evidence still needs fresh live confirmation.",
      href: founder ? "/admin/users" : "/dashboard/setup",
    },
    {
      id: "rbac",
      label: "Role-based access",
      status: "ready",
      reason: "SUPER_ADMIN, ORG_OWNER, ADMIN, and USER scopes are enforced in access helpers and current admin/API routes.",
      nextAction: "Validate one founder, one org-owner, and one restricted-user session live.",
      evidenceNote: "Action required for fresh live role evidence.",
      href: founder ? "/admin" : "/dashboard/admin",
    },
    {
      id: "hr-privacy-pin",
      label: "HR privacy PIN",
      status: hrPinConfigured ? "limited" : "action-required",
      reason: hrPinConfigured
        ? "HR privacy PIN is managed per organisation. Validate locked, wrong-PIN, unlocked, and re-lock evidence before calling it ready."
        : "HR privacy PIN is not configured for this organisation yet. Set it in Workspace Admin Center → Privacy Locks.",
      nextAction: hrPinConfigured
        ? "Validate HR locked, wrong-PIN, unlocked, View Details, and re-lock behaviour."
        : "Open Workspace Admin Center → Privacy Locks and configure the HR privacy PIN.",
      evidenceNote: "Action required.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "accounting-privacy-pin",
      label: "Accounting privacy PIN",
      status: accountingPinConfigured ? "limited" : "action-required",
      reason: accountingPinConfigured
        ? "Accounting privacy PIN is managed per organisation. Validate locked/unlocked/export/approval evidence before treating it as ready."
        : "Accounting privacy PIN is not configured for this organisation yet. Set it in Workspace Admin Center → Privacy Locks.",
      nextAction: accountingPinConfigured
        ? "Validate Accounting locked, wrong-PIN, unlocked, View Details, exports, approvals, and re-lock behaviour."
        : "Open Workspace Admin Center → Privacy Locks and configure the Accounting privacy PIN.",
      evidenceNote: "Action required.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "founder-boundary",
      label: "Founder versus workspace admin boundary",
      status: "ready",
      reason: "Founder-only platform surfaces are separated from workspace-admin controls, but fresh org-owner regression evidence is still required.",
      nextAction: "Use the org-owner account for a fresh live regression pass.",
      evidenceNote: "Fresh evidence still required after redeploy.",
      href: founder ? "/admin/system" : "/dashboard/admin",
    },
    {
      id: "workspace-admin-controls",
      label: "Workspace admin controls",
      status: "limited",
      reason: "Privacy locks, offboarding guidance, and role review now live inside Workspace Admin Center, but browser validation still needs capture.",
      nextAction: "Validate privacy-lock management, offboarding checklist usage, and role review links in Workspace Admin Center.",
      evidenceNote: "Action required.",
      href: "/dashboard/admin",
    },
  ]
}

export function getModuleReadiness(context: LaunchContext): ReadinessItem[] {
  const cloudinary = getProviderDiagnostics().find((item) => item.id === "cloudinary")?.status || "missing"
  const ai = getProviderDiagnostics().find((item) => item.id === "ai")?.status || "missing"
  return [
    {
      id: "workspace-identity",
      label: "Workspace identity and operating context",
      status:
        context.orgName?.trim() &&
        context.industry?.trim() &&
        context.operatingTemplate?.trim() &&
        context.legalBusinessName?.trim()
          ? context.logoUrl
            ? "limited"
            : "limited"
          : "action-required",
      reason:
        context.orgName?.trim() &&
        context.industry?.trim() &&
        context.operatingTemplate?.trim() &&
        context.legalBusinessName?.trim()
          ? "Company identity, formal document identity, and operating context are configured. Browser validation still needs to confirm replace/remove logo flows and in-app visibility."
          : "Workspace/company identity or formal document identity is not complete enough to present Civis as a finished operating centre yet.",
      nextAction:
        context.orgName?.trim() &&
        context.industry?.trim() &&
        context.operatingTemplate?.trim() &&
        context.legalBusinessName?.trim()
          ? "Validate sidebar, setup, launch readiness, and invoice-facing identity usage in the browser."
          : "Set workspace identity plus legal/document identity from Setup or Workspace profile.",
      evidenceNote: "Action required.",
      href: "/dashboard/setup",
    },
    {
      id: "crm",
      label: "CRM",
      status: "limited",
      reason: "Core CRM routes and persistence exist, but fresh live CRUD evidence is still required.",
      nextAction: "Create, edit, and refresh one contact, company, and deal.",
      evidenceNote: "Action required.",
      href: "/dashboard/crm",
    },
    {
      id: "crm-redesign",
      label: "CRM operating-centre redesign",
      status: "limited",
      reason: "CRM now carries delivery and billing handoff context, but live validation evidence is still pending.",
      nextAction: "Open CRM and validate related projects, invoices, and role-adaptable layouts with real data.",
      evidenceNote: "Action required.",
      href: "/dashboard/crm",
    },
    {
      id: "crm-field-builder",
      label: "CRM field builder",
      status: "limited",
      reason: "Field types and layout control are richer now, but persistence and validation still need evidence.",
      nextAction: "Create one custom field, refresh the view, and confirm it remains usable.",
      evidenceNote: "Action required.",
      href: "/dashboard/crm",
    },
    {
      id: "accounting",
      label: "Accounting",
      status: "limited",
      reason: "Accounting pages, privacy lock, and approval flows exist, but launch sign-off still depends on live approval and privacy evidence.",
      nextAction: "Validate invoice and expense approvals plus Accounting privacy unlock and re-lock.",
      evidenceNote: "Action required.",
      href: "/dashboard/accounting",
    },
    {
      id: "invoice-document-fields",
      label: "Invoice document fields",
      status: "limited",
      reason: "Notes, terms, line items, and related links are editable now, but launch evidence is still pending.",
      nextAction: "Update one invoice document end-to-end and confirm the data survives refresh.",
      evidenceNote: "Action required.",
      href: "/dashboard/accounting",
    },
    {
      id: "crm-invoice-links",
      label: "CRM to Invoices links",
      status: "limited",
      reason: "Invoices can now be linked back to CRM and project context, but live browser validation still needs capture.",
      nextAction: "Link one invoice to a CRM record and project, refresh, and confirm the links remain visible.",
      evidenceNote: "Action required.",
      href: "/dashboard/accounting",
    },
    {
      id: "operations",
      label: "Operations",
      status: "limited",
      reason: "Operations is real enough for approvals and workflows, but final queue/action evidence still needs capture.",
      nextAction: "Confirm pending approvals, approve/reject persistence, and refresh behavior.",
      evidenceNote: "Action required.",
      href: "/dashboard/operations",
    },
    {
      id: "hr",
      label: "HR",
      status: "limited",
      reason: "HR backend and privacy lock are present, but final locked and unlocked privacy validation evidence is still pending.",
      nextAction: "Validate locked and unlocked employee and payroll detail behaviour with an authorized user.",
      evidenceNote: "Action required.",
      href: "/dashboard/hr",
    },
    {
      id: "inventory",
      label: "Inventory",
      status: "limited",
      reason: "Inventory APIs exist, but launch quality still depends on live create/edit/refresh validation.",
      nextAction: "Validate products, stock, and purchase-order flows with refresh.",
      evidenceNote: "Action required.",
      href: "/dashboard/inventory",
    },
    {
      id: "projects",
      label: "Projects",
      status: "limited",
      reason: "Projects and tasks have real routes, but live workflow evidence still needs to be captured.",
      nextAction: "Create or update one project and one task, then refresh.",
      evidenceNote: "Action required.",
      href: "/dashboard/projects",
    },
    {
      id: "crm-project-links",
      label: "CRM to Projects links",
      status: "limited",
      reason: "Projects now accept linked company, contact, and deal context from CRM, but live validation is still pending.",
      nextAction: "Create or edit one project with a linked CRM record and confirm the relationship after refresh.",
      evidenceNote: "Action required.",
      href: "/dashboard/projects",
    },
    {
      id: "project-proof-links",
      label: "Project proof and external links",
      status: "limited",
      reason:
        cloudinary === "configured"
          ? "Proof, repository, deployment, and documentation links are usable and uploads are provider-configured, but live evidence is still pending."
          : "Proof and external links are usable now, but storage-backed upload claims stay blocked until Cloudinary is validated.",
      nextAction:
        cloudinary === "configured"
          ? "Validate one project with proof links and one upload-backed artifact."
          : "Validate external proof links now and keep file-upload claims blocked until storage is proven.",
      evidenceNote: "Action required.",
      href: "/dashboard/projects",
    },
    {
      id: "gallery",
      label: "Gallery",
      status: cloudinary === "configured" ? "limited" : "blocked",
      reason:
        cloudinary === "configured"
          ? "Cloudinary is configured, but upload evidence still needs to be recorded."
          : "Uploads must stay blocked or clearly setup-required until Cloudinary is fully configured.",
      nextAction: cloudinary === "configured" ? "Run one upload and confirm persisted media." : "Finish Cloudinary configuration first.",
      evidenceNote: cloudinary === "configured" ? "Action required." : "Blocked by provider configuration.",
      href: "/dashboard/gallery",
    },
    {
      id: "marketing",
      label: "Marketing",
      status: "preview-only",
      reason: "Marketing is intentionally presented as a preview rather than a live send system.",
      nextAction: "Keep preview-only messaging honest and disable any broken or fake-success actions.",
      evidenceNote: "Preview-only by design.",
      href: "/dashboard/marketing",
    },
    {
      id: "ai-guide",
      label: "AI / Civis Guide",
      status: ai === "configured" ? "limited" : "ready",
      reason:
        ai === "configured"
          ? "Deterministic commands work and provider-backed paths are available, but live evidence still needs capture."
          : "Deterministic command routing is available even without external providers; external model responses are disabled or limited.",
      nextAction:
        ai === "configured"
          ? "Validate deterministic commands plus one provider-backed answer."
          : "Validate deterministic navigation and setup guidance only.",
      evidenceNote: ai === "configured" ? "Action required." : "Ready for deterministic validation.",
      href: "/dashboard/ai",
    },
    {
      id: "civis-guide-knowledge",
      label: "Civis Guide operating-centre knowledge",
      status: "limited",
      reason: "Deterministic guidance now covers setup, launch readiness, CRM links, invoice links, and project proof flows, but validation is still pending.",
      nextAction: "Ask the new guided questions in Civis Guide and record the results.",
      evidenceNote: "Action required.",
      href: "/dashboard/ai",
    },
    {
      id: "liquid-glass-surfaces",
      label: "Liquid glass surfaces",
      status: "limited",
      reason: "The lighter glass treatment is now applied to core runtime surfaces, but final browser validation is still required.",
      nextAction: "Validate readability and interaction quality on CRM, Projects, Accounting, Setup, and Launch Readiness.",
      evidenceNote: "Action required.",
      href: "/dashboard",
    },
    {
      id: "settings",
      label: "Settings",
      status: "limited",
      reason: "Settings persistence is partly real, but unsupported toggles must remain clearly labeled.",
      nextAction: "Validate profile, workspace, and supported preference saves with refresh.",
      evidenceNote: "Action required.",
      href: "/dashboard/settings",
    },
    {
      id: "admin",
      label: "Admin",
      status: "limited",
      reason: "Admin boundaries are in place, but founder/org-owner live regression still needs current evidence.",
      nextAction: "Validate founder-only and workspace-only admin pages with separate accounts.",
      evidenceNote: "Action required.",
      href: context.role === "SUPER_ADMIN" ? "/admin" : "/dashboard/admin",
    },
  ]
}

export function getLaunchEvidence(context: LaunchContext = {}): ReadinessItem[] {
  return [
    {
      id: "smoke-test",
      label: "Smoke test result",
      status: "ready",
      reason: "A previous live smoke pass documented logged-out protection and zero route-level failures.",
      nextAction: "Re-run the smoke script after each redeploy and attach the fresh output.",
      evidenceNote: "See docs/operations/p0-live-validation-log.md.",
      href: "/admin/launch-readiness",
    },
    {
      id: "invite-flow",
      label: "Invite flow evidence",
      status: "action-required",
      reason: "Invite and acceptance flows still need a fresh launch-window validation pass.",
      nextAction: "Run founder invite, acceptance, and role/org validation with screenshots.",
      evidenceNote: "Action required.",
      href: "/dashboard/settings",
    },
    {
      id: "approval-lifecycle",
      label: "Approval lifecycle evidence",
      status: "action-required",
      reason: "Accounting and Operations approvals need fresh persisted-state evidence.",
      nextAction: "Record request, approve/reject, and refresh behavior.",
      evidenceNote: "Action required.",
      href: "/dashboard/operations",
    },
    {
      id: "crm-persistence",
      label: "CRM persistence evidence",
      status: "action-required",
      reason: "CRM CRUD still needs live create/edit/delete evidence for this launch window.",
      nextAction: "Run one contact/company/deal cycle and capture the refresh result.",
      evidenceNote: "Action required.",
      href: "/dashboard/crm",
    },
    {
      id: "workspace-identity-evidence",
      label: "Workspace identity evidence",
      status: "action-required",
      reason:
        context.orgName?.trim() || context.logoUrl || context.industry?.trim() || context.operatingTemplate?.trim()
          ? "Company name, logo behavior, and operating template visibility still need browser evidence."
          : "Workspace identity still needs setup plus browser evidence before it can be treated as launch-ready.",
      nextAction: "Validate upload, replace, remove, refresh, and non-admin view behavior for company identity.",
      evidenceNote: "Action required.",
      href: "/dashboard/setup",
    },
    {
      id: "fake-data-review",
      label: "Fake-data review evidence",
      status: "action-required",
      reason: "Sample or demo data still requires a final human review before sign-off.",
      nextAction: "Review visible seed/demo data and log the result.",
      evidenceNote: "Action required.",
      href: "/dashboard/demo",
    },
    {
      id: "backup-evidence",
      label: "Backup evidence",
      status: "action-required",
      reason: "Backup proof is not yet recorded in the current launch pack.",
      nextAction: "Document the latest successful backup evidence.",
      evidenceNote: "Action required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "restore-drill",
      label: "Restore drill evidence",
      status: "action-required",
      reason: "Restore drill sign-off is not yet documented for launch approval.",
      nextAction: "Run or document the restore drill and record the outcome.",
      evidenceNote: "Action required.",
      href: "/admin/launch-readiness",
    },
    {
      id: "provider-validation",
      label: "Provider validation evidence",
      status: "action-required",
      reason: "Configured providers still require live proof instead of assumed readiness.",
      nextAction: "Capture one validated email, upload, rate-limit, and billing check where applicable.",
      evidenceNote: "Action required.",
      href: "/dashboard/setup",
    },
  ]
}

export function getWorkspaceSetupItems(context: LaunchContext): ReadinessItem[] {
  const counts = context.counts || {}
  const providers = getProviderDiagnostics()
  const smtp = providers.find((item) => item.id === "smtp")?.status || "missing"
  const cloudinary = providers.find((item) => item.id === "cloudinary")?.status || "missing"
  const upstash = providers.find((item) => item.id === "upstash")?.status || "missing"
  const stripe = providers.find((item) => item.id === "stripe")?.status || "missing"
  const isFounder = canViewFounderControls(context.role, context.email)

  return [
    {
      id: "company-name",
      label: "Set company or workspace name",
      status: context.orgName?.trim() ? "ready" : "action-required",
      reason: context.orgName?.trim()
        ? "Workspace identity has a real company or workspace name."
        : "A real company or workspace name should be set before launch or external-facing invoice use.",
      nextAction: context.orgName?.trim() ? "Review identity placement in sidebar, setup, and workspace profile." : "Set the workspace/company name from Setup or Workspace profile.",
      href: "/dashboard/setup",
    },
    {
      id: "company-logo",
      label: "Add company logo",
      status: context.logoUrl ? "limited" : "optional",
      reason: context.logoUrl
        ? "A workspace logo is configured, but browser validation should still confirm it survives refresh and replacement."
        : "A logo is recommended for a polished operating centre and invoice identity, but it is not a hard launch blocker.",
      nextAction: context.logoUrl ? "Validate replace/remove behavior and refresh persistence." : "Upload a workspace logo or keep initials fallback intentionally.",
      href: "/dashboard/setup",
    },
    {
      id: "document-legal-name",
      label: "Set legal business name for invoices",
      status: context.legalBusinessName?.trim() ? "ready" : "action-required",
      reason: context.legalBusinessName?.trim()
        ? "Formal invoice and document identity has a legal business name."
        : "Invoices should not go live without a formal business name for document branding.",
      nextAction: context.legalBusinessName?.trim()
        ? "Validate invoice branding against the legal business name."
        : "Add the legal business name in Company Identity → Document identity.",
      href: "/dashboard/setup",
    },
    {
      id: "industry-template",
      label: "Set industry and operating template",
      status: context.industry?.trim() && context.operatingTemplate?.trim() ? "ready" : "action-required",
      reason:
        context.industry?.trim() && context.operatingTemplate?.trim()
          ? "Industry and primary operating template are configured."
          : "Industry and operating template help Civis explain the right CRM, projects, and finance workflow for this workspace.",
      nextAction:
        context.industry?.trim() && context.operatingTemplate?.trim()
          ? "Review whether the selected template still matches the operating model."
          : "Choose the industry and primary operating template in Setup or Workspace profile.",
      href: "/dashboard/setup",
    },
    {
      id: "first-crm-records",
      label: "Create first CRM contact, company, and deal",
      status:
        (counts.contacts || 0) > 0 && (counts.companies || 0) > 0 && (counts.deals || 0) > 0 ? "ready" : "action-required",
      reason:
        (counts.contacts || 0) > 0 && (counts.companies || 0) > 0 && (counts.deals || 0) > 0
          ? "Core CRM entities already exist in this workspace."
          : "Civis Pulse and sales workflows stay thin until at least one contact, company, and deal exist.",
      nextAction: "Open CRM and create the first sales records.",
      href: "/dashboard/crm",
    },
    {
      id: "crm-correlation",
      label: "Link CRM to delivery and billing",
      status: (counts.deals || 0) > 0 ? "limited" : "action-required",
      reason:
        (counts.deals || 0) > 0
          ? "The workspace now has enough CRM data to begin linking projects and invoices to live customer records."
          : "Without at least one deal or account, project and invoice linkage stays empty.",
      nextAction: "Link one project and one invoice back to a CRM company or deal.",
      href: "/dashboard/projects",
    },
    {
      id: "industry-role-adaptability",
      label: "Choose an industry and role operating pattern",
      status: "limited",
      reason: "The redesigned CRM should adapt to sales, service, operations, and engineering-heavy teams rather than one fixed workflow.",
      nextAction: "Use Setup to choose which team owns CRM, Projects, and Accounting handoffs first.",
      href: "/dashboard/setup",
    },
    {
      id: "invite-team-member",
      label: "Invite a team member",
      status: (counts.users || 0) > 1 ? "ready" : "action-required",
      reason:
        (counts.users || 0) > 1
          ? "This workspace already has more than one user."
          : "A second user is needed to validate org-scoped onboarding and admin boundaries.",
      nextAction: "Invite one teammate using workspace admin controls.",
      href: "/dashboard/admin",
    },
    {
      id: "hr-privacy-pin",
      label: "Set HR privacy PIN",
      status: (counts.hrPrivacyConfigured || 0) > 0 ? "ready" : "action-required",
      reason:
        (counts.hrPrivacyConfigured || 0) > 0
          ? "HR privacy PIN is configured for this organisation."
          : "HR privacy PIN must be managed inside Civis, not through hidden deployment setup.",
      nextAction:
        (counts.hrPrivacyConfigured || 0) > 0
          ? "Validate locked, wrong-PIN, unlocked, and re-lock behaviour in HR."
          : "Open Workspace Admin Center → Privacy Locks and set the HR PIN.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "accounting-privacy-pin",
      label: "Set Accounting privacy PIN",
      status: (counts.accountingPrivacyConfigured || 0) > 0 ? "ready" : "action-required",
      reason:
        (counts.accountingPrivacyConfigured || 0) > 0
          ? "Accounting privacy PIN is configured for this organisation."
          : "Accounting privacy PIN must be managed per organisation inside Civis before sensitive finance data is treated as ready.",
      nextAction:
        (counts.accountingPrivacyConfigured || 0) > 0
          ? "Validate locked, wrong-PIN, unlocked, export, approval, and re-lock behaviour in Accounting."
          : "Open Workspace Admin Center → Privacy Locks and set the Accounting PIN.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "review-hr-access",
      label: "Review HR access",
      status: "action-required",
      reason: "Confirm which workspace users can manage HR data before launch and after staff changes.",
      nextAction: "Open Workspace Admin Center and review HR-access users plus role assignments.",
      href: "/dashboard/admin#roles-and-permissions",
    },
    {
      id: "review-accounting-access",
      label: "Review Accounting access",
      status: "action-required",
      reason: "Confirm which users can unlock Accounting privacy, approve finance work, and export sensitive data.",
      nextAction: "Open Workspace Admin Center and review Accounting access, approvals, and exports.",
      href: "/dashboard/admin#roles-and-permissions",
    },
    {
      id: "review-admin-users",
      label: "Review admin users",
      status: (counts.users || 0) > 1 ? "limited" : "action-required",
      reason:
        (counts.users || 0) > 1
          ? "More than one user exists, but privileged access still needs a human review."
          : "You still need at least one additional user before admin-boundary review is meaningful.",
      nextAction: "Review current admins, pending invites, and access profiles in Workspace Admin Center.",
      href: "/dashboard/admin#users-and-invites",
    },
    {
      id: "rotate-privacy-after-staff-change",
      label: "Rotate privacy PINs after staff changes",
      status: "action-required",
      reason: "Offboarding sensitive staff should always include PIN rotation and force-lock of active unlock sessions.",
      nextAction: "Use the Offboarding & Access Review checklist after HR or finance staffing changes.",
      href: "/dashboard/admin#offboarding-and-access-review",
    },
    {
      id: "smtp",
      label: "Configure email / SMTP",
      status: smtp === "configured" ? "limited" : isFounder ? "action-required" : "blocked",
      reason:
        smtp === "configured"
          ? "SMTP is configured, but email delivery still needs live evidence."
          : isFounder
            ? "SMTP is still missing or partial, so email flows are not fully launch-ready."
            : "SMTP requires deployment-level configuration outside the normal workspace UI.",
      nextAction: isFounder ? "Finish SMTP config, then send a live invite or digest." : "Ask the founder/admin to complete SMTP setup.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/admin#setup-and-launch-readiness",
    },
    {
      id: "cloudinary",
      label: "Configure uploads / Cloudinary",
      status: cloudinary === "configured" ? "limited" : isFounder ? "action-required" : "blocked",
      reason:
        cloudinary === "configured"
          ? "Upload credentials are configured, but real upload evidence is still pending."
          : isFounder
            ? "Cloudinary is not fully configured, so uploads should still be treated as blocked."
            : "Upload configuration requires deployment-level access.",
      nextAction: isFounder ? "Complete Cloudinary setup and validate one upload." : "Ask the founder/admin to complete upload setup.",
      href: cloudinary === "configured" ? "/dashboard/gallery" : isFounder ? "/admin/launch-readiness" : "/dashboard/gallery",
    },
    {
      id: "rate-limit",
      label: "Configure rate limit / Upstash",
      status: upstash === "configured" ? "limited" : upstash === "limited" ? "limited" : isFounder ? "action-required" : "blocked",
      reason:
        upstash === "configured"
          ? "Shared rate limiting is configured, but live protected-endpoint evidence is still pending."
          : upstash === "limited"
            ? "Rate limiting is present but not using a shared remote store."
            : isFounder
              ? "Rate limiting still needs deployment-level configuration."
              : "Remote rate-limit configuration requires founder/admin deployment access.",
      nextAction: isFounder ? "Finish or validate the shared rate-limit store." : "Ask the founder/admin to validate rate limiting.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/admin#setup-and-launch-readiness",
    },
    {
      id: "stripe",
      label: "Configure Stripe if billing is in scope",
      status: stripe === "test" || stripe === "configured" ? "limited" : isFounder ? "optional" as LaunchStatus : "blocked",
      reason:
        stripe === "test"
          ? "Stripe is test-configured, but billing still needs live validation before any live claims."
          : stripe === "configured"
            ? "Stripe appears configured, but billing evidence is still missing."
            : "Billing should remain out of the launch story unless it is intentionally being validated now.",
      nextAction:
        stripe === "test" || stripe === "configured"
          ? "Keep pricing honest and validate billing before presenting it as live."
          : "Leave billing out of scope until Stripe is intentionally validated.",
      href: "/pricing",
    },
    {
      id: "hr-pin",
      label: "Review HR privacy PIN",
      status: "action-required",
      reason: "HR privacy PIN is managed per organisation. Configure it in Privacy Locks and validate locked/unlocked evidence.",
      nextAction: "Validate wrong PIN, correct PIN, and re-lock behavior in HR.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "accounting-pin",
      label: "Review Accounting privacy PIN",
      status: "action-required",
      reason: "Accounting privacy PIN is managed per organisation. Configure it in Privacy Locks and validate locked/unlocked/export/approval evidence.",
      nextAction: "Validate wrong PIN, correct PIN, exports, and re-lock behavior in Accounting.",
      href: "/dashboard/admin#privacy-locks",
    },
    {
      id: "roles",
      label: "Verify admin and user roles",
      status: (counts.users || 0) > 1 ? "limited" : "action-required",
      reason:
        (counts.users || 0) > 1
          ? "Multiple users exist, but role/boundary validation still needs evidence."
          : "Role validation is difficult with only one user in the workspace.",
      nextAction: "Review workspace users and validate at least one non-founder account.",
      href: "/dashboard/admin#roles-and-permissions",
    },
    {
      id: "first-approval",
      label: "Run first approval workflow",
      status: (counts.pendingApprovals || 0) > 0 || (counts.completedApprovals || 0) > 0 ? "limited" : "action-required",
      reason:
        (counts.pendingApprovals || 0) > 0 || (counts.completedApprovals || 0) > 0
          ? "Approval records already exist, but final evidence still needs capture."
          : "No approval activity exists yet for this workspace.",
      nextAction: "Create one approval request and verify it persists through decision.",
      href: "/dashboard/operations",
    },
    {
      id: "invoice-document-readiness",
      label: "Finish one invoice document with line items and terms",
      status: context.legalBusinessName?.trim() ? "action-required" : "blocked",
      reason: context.legalBusinessName?.trim()
        ? "The invoice editor is only meaningful once one real invoice has linked work, notes, terms, line items, and document branding saved through refresh."
        : "Formal invoice identity is still incomplete, so invoice branding is not ready for launch sign-off.",
      nextAction: context.legalBusinessName?.trim()
        ? "Open Accounting and complete one invoice document end-to-end."
        : "Add legal business name and document identity before invoice launch sign-off.",
      href: "/dashboard/accounting",
    },
    {
      id: "project-proof-readiness",
      label: "Attach proof and system links to one project",
      status: "action-required",
      reason: "Projects now support proof notes, client URLs, repository links, docs, deployment links, and monitoring links.",
      nextAction: "Open Projects and add at least one proof link plus one external system link.",
      href: "/dashboard/projects",
    },
    {
      id: "launch-readiness-review",
      label: "Review launch readiness inside the app",
      status: isFounder ? "limited" : "ready",
      reason:
        isFounder
          ? "Founder launch readiness is visible in-app now, but it still depends on fresh evidence."
          : "Workspace setup now points clearly to founder-owned launch blockers without hiding them in docs only.",
      nextAction: isFounder ? "Review the founder readiness board after each major validation run." : "Use Setup to track what the founder still owns.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/setup",
    },
    {
      id: "marketing-preview",
      label: "Review Marketing preview-only status",
      status: "limited",
      reason: "Marketing is intentionally preview-only in this release and must stay clearly non-production.",
      nextAction: "Keep preview-only messaging intact during demos.",
      href: "/dashboard/marketing",
    },
    {
      id: "demo-data",
      label: "Review fake or demo data",
      status: "action-required",
      reason: "Any sample or seeded records should be intentionally labeled before demos.",
      nextAction: "Review visible data and remove or label anything that looks like a fake customer claim.",
      href: "/dashboard/demo",
    },
    {
      id: "backup-restore",
      label: "Backup and restore evidence",
      status: isFounder ? "action-required" : "blocked",
      reason:
        isFounder
          ? "Launch approval still depends on backup and restore evidence."
          : "Backup and restore sign-off sits with the founder/admin release owner.",
      nextAction: isFounder ? "Update the launch blocker register with current evidence." : "Ask the founder/admin for the latest evidence status.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/settings",
    },
  ]
}
