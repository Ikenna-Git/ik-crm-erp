export type KnowledgeEntry = {
  title: string
  keywords: string[]
  content: string
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
