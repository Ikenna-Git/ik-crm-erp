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
