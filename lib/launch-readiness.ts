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
      status: process.env.DATABASE_URL ? "configured" : "missing",
      reason: process.env.DATABASE_URL
        ? "The primary database connection string is present."
        : "Without DATABASE_URL, authenticated modules cannot persist real product state.",
      nextAction: process.env.DATABASE_URL ? "Run live migration/build validation before launch." : "Add DATABASE_URL and verify Prisma connectivity.",
      evidenceNote: process.env.DATABASE_URL ? "Runtime validation still required." : "Action required.",
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
              : "No provider keys are present for external model responses.",
      nextAction:
        aiStatus === "configured"
          ? `Validate the configured provider path${aiProvider ? ` for ${aiProvider}` : ""}.`
          : "Keep Civis Guide messaging honest about deterministic-only or disabled mode.",
      evidenceNote:
        aiStatus === "configured" ? "Provider configured, evidence pending." : aiStatus === "disabled" ? "Intentional." : "Action required.",
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
              : "Stripe is not configured.",
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
            : "No monitoring or alerting endpoints are configured.",
      nextAction:
        observabilityStatus === "configured"
          ? "Record one handled incident or alert delivery proof."
          : "Add Sentry or webhook-based alerts before broader rollout.",
      evidenceNote: observabilityStatus === "configured" ? "Provider configured, evidence pending." : "Action required.",
    },
  ]
}

export function getSecurityAccessReadiness(context: LaunchContext): ReadinessItem[] {
  const founder = canViewFounderControls(context.role, context.email)
  return [
    {
      id: "route-guards",
      label: "Protected route guards",
      status: "ready",
      reason: "Dashboard and admin route groups already enforce logged-out protection server-side.",
      nextAction: "Keep the live smoke pack in the release checklist after every deploy.",
      evidenceNote: "Documented smoke evidence exists for logged-out protection.",
      href: "/admin/launch-readiness",
    },
    {
      id: "org-isolation",
      label: "Org isolation",
      status: "ready",
      reason: "Workspace admin and founder-only boundaries are enforced server-side across current admin routes.",
      nextAction: "Re-run invite and org-owner validation after redeploy.",
      evidenceNote: "Role-boundary evidence still needs fresh live confirmation.",
      href: founder ? "/admin/users" : "/dashboard/settings",
    },
    {
      id: "rbac",
      label: "Role-based access",
      status: "ready",
      reason: "SUPER_ADMIN, ORG_OWNER, ADMIN, and USER scopes are modeled directly in access helpers and API routes.",
      nextAction: "Validate one founder, one org-owner, and one restricted-user session live.",
      evidenceNote: "Action required for fresh live role evidence.",
    },
    {
      id: "hr-privacy-pin",
      label: "HR privacy PIN",
      status: "limited",
      reason: "The product has an HR privacy lock and API redaction path, but launch evidence still needs to be captured.",
      nextAction: "Run the HR privacy workflow and record wrong-PIN and correct-PIN evidence.",
      evidenceNote: "Action required.",
      href: "/dashboard/hr",
    },
    {
      id: "accounting-privacy-pin",
      label: "Accounting privacy PIN",
      status: "limited",
      reason: "Accounting privacy lock and redaction are present, but exports and detail views still need final validation evidence.",
      nextAction: "Validate locked, wrong-PIN, unlocked, and re-lock states.",
      evidenceNote: "Action required.",
      href: "/dashboard/accounting",
    },
    {
      id: "founder-boundary",
      label: "Founder versus workspace admin boundary",
      status: "ready",
      reason: "Founder-only platform surfaces are separated from workspace-admin controls.",
      nextAction: "Use the org-owner account for a fresh live regression pass.",
      evidenceNote: "Fresh evidence still required after redeploy.",
      href: founder ? "/admin/system" : "/dashboard/admin",
    },
  ]
}

export function getModuleReadiness(context: LaunchContext): ReadinessItem[] {
  const cloudinary = getProviderDiagnostics().find((item) => item.id === "cloudinary")?.status || "missing"
  const ai = getProviderDiagnostics().find((item) => item.id === "ai")?.status || "missing"
  return [
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
      id: "accounting",
      label: "Accounting",
      status: "limited",
      reason: "Accounting pages and approval flows exist, but launch sign-off still depends on live approval evidence.",
      nextAction: "Validate invoice and expense approval lifecycles end-to-end.",
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
      reason: "HR backend and privacy lock are present, but final privacy validation evidence is still pending.",
      nextAction: "Test locked and unlocked employee detail behavior with an authorized user.",
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
          : "Deterministic command routing is available even without external providers.",
      nextAction:
        ai === "configured"
          ? "Validate deterministic commands plus one provider-backed answer."
          : "Validate deterministic navigation and setup guidance only.",
      evidenceNote: ai === "configured" ? "Action required." : "Ready for deterministic validation.",
      href: "/dashboard/ai",
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

export function getLaunchEvidence(): ReadinessItem[] {
  return [
    {
      id: "smoke-test",
      label: "Smoke test result",
      status: "ready",
      reason: "A previous live smoke pass documented logged-out protection and zero route-level failures.",
      nextAction: "Re-run the smoke script after each redeploy and attach the fresh output.",
      evidenceNote: "See docs/operations/p0-live-validation-log.md.",
    },
    {
      id: "invite-flow",
      label: "Invite flow evidence",
      status: "action-required",
      reason: "Invite and acceptance flows still need a fresh launch-window validation pass.",
      nextAction: "Run founder invite, acceptance, and role/org validation with screenshots.",
      evidenceNote: "Action required.",
    },
    {
      id: "approval-lifecycle",
      label: "Approval lifecycle evidence",
      status: "action-required",
      reason: "Accounting and Operations approvals need fresh persisted-state evidence.",
      nextAction: "Record request, approve/reject, and refresh behavior.",
      evidenceNote: "Action required.",
    },
    {
      id: "crm-persistence",
      label: "CRM persistence evidence",
      status: "action-required",
      reason: "CRM CRUD still needs live create/edit/delete evidence for this launch window.",
      nextAction: "Run one contact/company/deal cycle and capture the refresh result.",
      evidenceNote: "Action required.",
    },
    {
      id: "fake-data-review",
      label: "Fake-data review evidence",
      status: "action-required",
      reason: "Sample or demo data still requires a final human review before sign-off.",
      nextAction: "Review visible seed/demo data and log the result.",
      evidenceNote: "Action required.",
    },
    {
      id: "backup-evidence",
      label: "Backup evidence",
      status: "action-required",
      reason: "Backup proof is not yet recorded in the current launch pack.",
      nextAction: "Document the latest successful backup evidence.",
      evidenceNote: "Action required.",
    },
    {
      id: "restore-drill",
      label: "Restore drill evidence",
      status: "action-required",
      reason: "Restore drill sign-off is not yet documented for launch approval.",
      nextAction: "Run or document the restore drill and record the outcome.",
      evidenceNote: "Action required.",
    },
    {
      id: "provider-validation",
      label: "Provider validation evidence",
      status: "action-required",
      reason: "Configured providers still require live proof instead of assumed readiness.",
      nextAction: "Capture one validated email, upload, rate-limit, and billing check where applicable.",
      evidenceNote: "Action required.",
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
      id: "invite-team-member",
      label: "Invite a team member",
      status: (counts.users || 0) > 1 ? "ready" : "action-required",
      reason:
        (counts.users || 0) > 1
          ? "This workspace already has more than one user."
          : "A second user is needed to validate org-scoped onboarding and admin boundaries.",
      nextAction: "Invite one teammate using workspace admin controls.",
      href: "/dashboard/settings",
    },
    {
      id: "smtp",
      label: "Configure email / SMTP",
      status: smtp === "configured" ? "ready" : isFounder ? "action-required" : "blocked",
      reason:
        smtp === "configured"
          ? "SMTP is configured."
          : isFounder
            ? "SMTP is still missing or partial, so email flows are not fully launch-ready."
            : "SMTP requires deployment-level configuration outside the normal workspace UI.",
      nextAction: isFounder ? "Finish SMTP config, then send a live invite or digest." : "Ask the founder/admin to complete SMTP setup.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/settings",
    },
    {
      id: "cloudinary",
      label: "Configure uploads / Cloudinary",
      status: cloudinary === "configured" ? "ready" : isFounder ? "action-required" : "blocked",
      reason:
        cloudinary === "configured"
          ? "Upload credentials are configured."
          : isFounder
            ? "Cloudinary is not fully configured, so uploads should still be treated as blocked."
            : "Upload configuration requires deployment-level access.",
      nextAction: isFounder ? "Complete Cloudinary setup and validate one upload." : "Ask the founder/admin to complete upload setup.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/gallery",
    },
    {
      id: "rate-limit",
      label: "Configure rate limit / Upstash",
      status: upstash === "configured" ? "ready" : upstash === "limited" ? "limited" : isFounder ? "action-required" : "blocked",
      reason:
        upstash === "configured"
          ? "Shared rate limiting is configured."
          : upstash === "limited"
            ? "Rate limiting is present but not using a shared remote store."
            : isFounder
              ? "Rate limiting still needs deployment-level configuration."
              : "Remote rate-limit configuration requires founder/admin deployment access.",
      nextAction: isFounder ? "Finish or validate the shared rate-limit store." : "Ask the founder/admin to validate rate limiting.",
      href: isFounder ? "/admin/launch-readiness" : "/dashboard/settings",
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
      reason: "HR privacy lock exists, but the team still needs to validate unlock and re-lock behavior.",
      nextAction: "Validate wrong PIN, correct PIN, and re-lock behavior in HR.",
      href: "/dashboard/hr",
    },
    {
      id: "accounting-pin",
      label: "Review Accounting privacy PIN",
      status: "action-required",
      reason: "Accounting privacy lock exists, but final live validation is still required.",
      nextAction: "Validate wrong PIN, correct PIN, exports, and re-lock behavior in Accounting.",
      href: "/dashboard/accounting",
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
      href: "/admin/users",
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
      id: "marketing-preview",
      label: "Review Marketing preview-only status",
      status: "ready",
      reason: "Marketing is intentionally positioned as preview-only rather than pretending to be live.",
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
