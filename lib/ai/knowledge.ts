export type KnowledgeEntry = {
  title: string
  keywords: string[]
  content: string
}

export type BestPracticeEntry = {
  title: string
  keywords: string[]
  guidance: string
}

export const CIVIS_KB: KnowledgeEntry[] = [
  {
    title: "CRM custom fields",
    keywords: ["crm", "field", "custom", "column", "property", "checkbox", "select"],
    content:
      "Civis CRM supports custom fields on contacts, companies, and deals. Use text, number, currency, date, select, multi-select, or checkbox fields. You can mark a field as required, reorder columns, and hide fields per view.",
  },
  {
    title: "CRM plus ERP operating centre",
    keywords: ["crm", "erp", "projects", "invoice", "handoff", "operating centre", "workflow"],
    content:
      "Civis is not just a contact manager. CRM records should connect to projects, invoices, approvals, proof links, and delivery workflows so one customer record can explain what should happen next across the business.",
  },
  {
    title: "Project proof and external links",
    keywords: ["project", "proof", "github", "repository", "deployment", "docs", "figma", "monitoring", "link"],
    content:
      "Projects can now store proof links and external system links such as GitHub repositories, deployment URLs, documentation, monitoring dashboards, tickets, design files, and client-site URLs. URLs must use http or https only.",
  },
  {
    title: "Invoice document fields and linking",
    keywords: ["invoice", "line item", "terms", "notes", "linked project", "linked deal", "related link"],
    content:
      "Invoices support notes, payment terms, line items, related links, and linked company/deal/project context. Use those fields so finance records keep the same business context as CRM and project delivery work.",
  },
  {
    title: "Industry and role adaptability",
    keywords: ["industry", "role", "adapt", "sales", "operations", "engineering", "finance", "setup"],
    content:
      "Civis should adapt to the operating pattern of the workspace. Sales-led teams may stay pipeline-first, while delivery or operations-heavy teams should link CRM records directly into projects, proof, and invoice flows.",
  },
  {
    title: "Company identity and workspace context",
    keywords: ["company identity", "workspace identity", "logo", "workspace context", "operating context", "industry", "template", "setup mode", "launch review", "live mode"],
    content:
      "Set company identity from Setup, Settings, or Workspace profile. The company name, logo, industry, and operating template are org-scoped and should persist after refresh. The workspace card shows current role, operating mode, and launch readiness summary. Setup mode means core workspace identity or first operating records are still incomplete. Launch review means the workspace is close but still has blockers or review items. Live means the operating centre passed the current readiness checks.",
  },
  {
    title: "Company logo handling",
    keywords: ["upload logo", "replace logo", "remove logo", "cloudinary", "branding", "workspace logo"],
    content:
      "Workspace logos are stored against the organization and must not fake success when upload storage is missing. Civis accepts safe image formats only, should show visible upload errors, and should fall back to initials immediately when the logo is removed.",
  },
  {
    title: "Document identity and invoice branding",
    keywords: ["legal business name", "document identity", "invoice branding", "invoice logo", "trading name", "payment instructions", "invoice terms"],
    content:
      "Workspace display identity is not the same thing as document identity. Invoices should use the legal business name and formal document identity. If no logo exists, formal invoices should fall back to clean text-only business identity, not an initials avatar. Default terms, notes, and payment instructions should come from the workspace document identity only when those fields are actually configured.",
  },
  {
    title: "Rebrand and historical invoice safety",
    keywords: ["rebrand", "acquisition", "change logo", "change business name", "old invoice branding", "historical invoice", "issued invoice snapshot"],
    content:
      "Changing the current workspace logo or business identity should affect future invoices and draft documents, not silently rewrite already issued invoices. Historical issued invoices should keep the branding snapshot that was used when they were issued unless the product explicitly supports a reissue flow.",
  },
  {
    title: "Ops command center",
    keywords: ["ops", "command", "operations", "alerts", "anomaly", "decision"],
    content:
      "The Ops Command Center shows your real-time business pulse: overdue invoices, pending expenses, stalled deals, and risky tasks. It suggests next actions and links directly to the right module.",
  },
  {
    title: "Client portal",
    keywords: ["portal", "client", "share", "document", "update", "link"],
    content:
      "Client portals let customers see updates, shared documents, and delivery status. You can post status updates, attach documents, and generate a secure share link for each client.",
  },
  {
    title: "Accounting reports",
    keywords: ["accounting", "report", "vat", "invoice", "expense", "export"],
    content:
      "Accounting reports include revenue vs expenses, VAT summaries, invoice aging, and CSV exports. Use the Reports panel to download or email CSV files.",
  },
  {
    title: "HR attendance",
    keywords: ["hr", "attendance", "leave", "payroll", "employee"],
    content:
      "The HR module supports attendance tracking, leave status, and payroll visibility controls. Use the attendance tracker to log check-ins, mark leave types, and set reminders for return dates.",
  },
  {
    title: "Privacy locks and launch statuses",
    keywords: ["privacy", "pin", "locked", "limited", "action required", "missing", "preview only", "launch readiness"],
    content:
      "HR and Accounting use separate privacy PIN locks. If HR or Accounting details are hidden, the module may still be privacy locked or your role may not be allowed to unlock it. In launch readiness, Limited means the feature exists but live evidence is still pending. Action Required means manual validation or evidence is still needed before launch approval. Missing means required configuration is absent. Preview Only means the feature is intentionally non-production in this release.",
  },
  {
    title: "Validation and disabled states",
    keywords: ["validation", "error", "disabled", "forbidden", "invalid url", "field disabled"],
    content:
      "Civis should surface validation and permission errors directly in the UI. Invalid URLs must be rejected, privacy-locked finance or HR actions should explain the lock clearly, and founder-only controls should stay blocked for workspace users.",
  },
  {
    title: "Playbooks and workflows",
    keywords: ["playbook", "workflow", "automation", "steps", "checklist"],
    content:
      "Playbooks provide guided workflows like onboarding, collections, or recruiting. Each run is tracked, with steps, owners, and completion status for audit readiness.",
  },
]

export const CIVIS_BEST_PRACTICES: BestPracticeEntry[] = [
  {
    title: "CRM data hygiene",
    keywords: ["crm", "lead", "contact", "pipeline", "quality", "duplicate"],
    guidance:
      "Keep one owner and one next action per deal. Require source, stage, expected close date, and last activity date to prevent silent pipeline decay.",
  },
  {
    title: "Sales follow-up cadence",
    keywords: ["follow-up", "sales", "deal", "stalled", "inactivity"],
    guidance:
      "Set inactivity triggers by stage (e.g. 3 days in discovery, 5 days in proposal). Auto-create reminders before opportunities go cold.",
  },
  {
    title: "Collections and cashflow",
    keywords: ["invoice", "accounting", "cashflow", "receivable", "overdue"],
    guidance:
      "Use a fixed invoice reminder ladder: pre-due reminder, due-date notice, and escalation at 7+ days overdue with assigned owner.",
  },
  {
    title: "HR attendance discipline",
    keywords: ["hr", "attendance", "leave", "payroll", "employee"],
    guidance:
      "Track attendance status daily and enforce leave windows with return-date alerts so payroll closes with fewer manual corrections.",
  },
  {
    title: "Operations reliability",
    keywords: ["ops", "workflow", "playbook", "webhook", "automation"],
    guidance:
      "Every automation should have owner, fallback step, and success metric. Review failed runs weekly and keep audit evidence for each critical flow.",
  },
  {
    title: "Security baseline",
    keywords: ["security", "admin", "access", "role", "audit"],
    guidance:
      "Apply least-privilege roles, rotate secrets quarterly, enforce MFA for admins, and review audit logs for unusual behavior every week.",
  },
  {
    title: "Workspace launch readiness discipline",
    keywords: ["launch readiness", "setup mode", "launch review", "blockers", "workspace blockers", "go live"],
    guidance:
      "Do not treat configuration as proof. Clear company identity, verify first CRM and finance records, keep provider gaps visible, and record actual browser evidence before calling a workspace live.",
  },
]

export const findKnowledge = (query: string) => {
  const input = query.toLowerCase()
  let best: { entry: KnowledgeEntry; score: number } | null = null
  for (const entry of CIVIS_KB) {
    const score = entry.keywords.reduce((sum, keyword) => (input.includes(keyword) ? sum + 1 : sum), 0)
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score }
    }
  }
  return best?.entry || null
}

export const getBestPracticeNuggets = (query: string, max = 3) => {
  const input = query.toLowerCase()
  const scored = CIVIS_BEST_PRACTICES.map((entry) => ({
    entry,
    score: entry.keywords.reduce((sum, keyword) => (input.includes(keyword) ? sum + 1 : sum), 0),
  }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  if (!scored.length) {
    return CIVIS_BEST_PRACTICES.slice(0, max).map((item) => item.guidance)
  }

  return scored.slice(0, max).map((item) => item.entry.guidance)
}
