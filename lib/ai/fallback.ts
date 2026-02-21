import { findKnowledge, getBestPracticeNuggets } from "@/lib/ai/knowledge"

type FallbackMode = "qna" | "summary" | "email" | "tour"

type SummaryContext = {
  stats?: Record<string, number>
  decisions?: { title: string; detail: string }[]
  recentActivity?: { title: string; detail?: string }[]
}

type EmailContext = {
  recipient?: string
  goal?: string
  tone?: string
  context?: string
}

type TourContext = {
  role?: string
  phase?: string
  stats?: {
    contacts?: number
    openDeals?: number
    overdueInvoices?: number
    pendingExpenses?: number
    employees?: number
    activePlaybooks?: number
    activeAutomations?: number
    activePortals?: number
  }
}

type TourModuleKey = "overview" | "crm" | "accounting" | "hr" | "operations" | "portal"

const inferTourPersona = (prompt: string) => {
  const value = prompt.toLowerCase()
  if (/(sales|crm|lead|deal)/.test(value)) return "Sales lead"
  if (/(finance|account|invoice|expense|cash)/.test(value)) return "Finance lead"
  if (/(hr|people|payroll|attendance|leave)/.test(value)) return "HR lead"
  if (/(ops|operation|workflow|automation|webhook)/.test(value)) return "Operations lead"
  if (/(ceo|founder|executive|owner)/.test(value)) return "Executive"
  return "Team lead"
}

const formatCount = (value: number | undefined, fallback: string) =>
  typeof value === "number" ? value.toLocaleString() : fallback

const TOUR_MODULES: Record<
  TourModuleKey,
  { title: string; route: string; objective: string; checklist: string[]; successSignal: string }
> = {
  overview: {
    title: "Overview command center",
    route: "Dashboard > Overview",
    objective: "Identify top business risk and top growth lever in 2 minutes.",
    checklist: [
      "Review overdue invoices, pending expenses, and open deals.",
      "Open the top alert and assign an owner with due date.",
      "Confirm today's priorities in recent activity feed.",
    ],
    successSignal: "You can name the #1 risk and the owner handling it.",
  },
  crm: {
    title: "CRM execution lane",
    route: "Dashboard > CRM",
    objective: "Keep deals moving with complete and actionable records.",
    checklist: [
      "Ensure each active deal has owner, next step, expected close date, and stage.",
      "Use custom fields for segment, source, and qualification status.",
      "Run follow-up generator for stalled deals and inactive contacts.",
    ],
    successSignal: "No active deal is missing next action or owner.",
  },
  accounting: {
    title: "Accounting control lane",
    route: "Dashboard > Accounting",
    objective: "Protect cashflow and maintain export-ready finance records.",
    checklist: [
      "Review overdue invoices and send reminder ladder.",
      "Approve or reject pending expenses with clear note.",
      "Export summary/report CSV for management review.",
    ],
    successSignal: "Overdue count trends down and approvals are current.",
  },
  hr: {
    title: "HR operations lane",
    route: "Dashboard > HR",
    objective: "Maintain attendance discipline and payroll readiness.",
    checklist: [
      "Update attendance states (present, leave, sick, remote) for each employee.",
      "Set leave return reminders to avoid missed resumptions.",
      "Lock sensitive payroll views behind access checks.",
    ],
    successSignal: "Attendance is complete daily and payroll changes are controlled.",
  },
  operations: {
    title: "Operations and automation",
    route: "Dashboard > Operations / Playbooks",
    objective: "Run reliable workflows with measurable outcomes.",
    checklist: [
      "Audit active workflows and disable noisy/duplicate automations.",
      "Review playbook runs and unblock stalled steps.",
      "Verify webhook endpoint health and retry handling.",
    ],
    successSignal: "Critical workflows have owners, fallback, and low failure rate.",
  },
  portal: {
    title: "Client communication lane",
    route: "Dashboard > Client Portal",
    objective: "Deliver transparent client updates and document sharing.",
    checklist: [
      "Post structured status update with next milestone.",
      "Attach latest document version and remove stale files.",
      "Confirm share link/access code and portal state.",
    ],
    successSignal: "Client can self-serve status and docs without back-and-forth email.",
  },
}

const parseTourStepRequest = (prompt: string): TourModuleKey | null => {
  const value = prompt.toLowerCase()
  if (/(step\s*1)/.test(value)) return "overview"
  if (/(step\s*2)/.test(value)) return "crm"
  if (/(step\s*3)/.test(value)) return "accounting"
  if (/(step\s*4)/.test(value)) return "hr"
  if (/(step\s*5)/.test(value)) return "operations"
  if (/(step\s*6)/.test(value)) return "portal"

  const asksDeepDive = /(guide me on|focus on|drill into|deep dive|go deeper)/.test(value)
  if (!asksDeepDive) return null

  if (/(overview|command center)/.test(value)) return "overview"
  if (/(crm|deal|pipeline|contact)/.test(value)) return "crm"
  if (/(accounting|invoice|expense|cashflow)/.test(value)) return "accounting"
  if (/(hr|attendance|payroll|leave)/.test(value)) return "hr"
  if (/(operations|playbook|workflow|webhook)/.test(value)) return "operations"
  if (/(portal|client portal|client update|share link)/.test(value)) return "portal"
  return null
}

const buildStepDeepDive = (moduleKey: TourModuleKey, prompt: string) => {
  const module = TOUR_MODULES[moduleKey]
  const tips = getBestPracticeNuggets(`${prompt} ${module.title}`, 2)
  return `${module.title} deep dive\n\nRoute: ${module.route}\nGoal: ${module.objective}\n\nAction checklist:\n1. ${module.checklist[0]}\n2. ${module.checklist[1]}\n3. ${module.checklist[2]}\n\nBest-practice extras:\n- ${tips[0]}\n- ${tips[1]}\n\nDone criteria: ${module.successSignal}\n\nReply with: "continue to next step" when done.`
}

const buildSmartTour = (prompt: string, context: unknown, userName: string) => {
  const details = (context || {}) as TourContext
  const requestedStep = parseTourStepRequest(prompt)
  if (requestedStep) {
    return buildStepDeepDive(requestedStep, prompt)
  }
  const persona = details.role || inferTourPersona(prompt)
  const stats = details.stats || {}
  const externalTips = getBestPracticeNuggets(prompt, 3)

  return `Smart tour for ${persona}, ${userName}:\n\n1. Overview command center\n- Open: Dashboard > Overview\n- What to confirm now: ${formatCount(stats.overdueInvoices, "0")} overdue invoices, ${formatCount(stats.pendingExpenses, "0")} pending expenses, ${formatCount(stats.openDeals, "0")} open deals.\n- Outcome: identify top 1 risk before touching any module.\n\n2. CRM execution lane\n- Open: Dashboard > CRM\n- Focus: ${formatCount(stats.contacts, "0")} contacts and stalled deals.\n- Action pattern: update next step + owner + expected close date on every active deal.\n\n3. Accounting control lane\n- Open: Dashboard > Accounting\n- Focus: overdue invoices, pending expenses, and exports.\n- Action pattern: clear approvals first, then send reminders from reports.\n\n4. HR operations lane\n- Open: Dashboard > HR\n- Focus: ${formatCount(stats.employees, "0")} employees, attendance, and leave return alerts.\n- Action pattern: close attendance daily before payroll review.\n\n5. Operations and automation\n- Open: Dashboard > Operations / Playbooks\n- Focus: ${formatCount(stats.activeAutomations, "0")} active workflows and ${formatCount(stats.activePlaybooks, "0")} active playbook runs.\n- Action pattern: review failed runs and assign a fallback owner.\n\n6. Client communication lane\n- Open: Dashboard > Client Portal\n- Focus: ${formatCount(stats.activePortals, "0")} active portals with updates/docs.\n- Action pattern: post weekly updates and attach latest deliverables.\n\nExternal best-practice notes:\n- ${externalTips[0]}\n- ${externalTips[1]}\n- ${externalTips[2]}\n\nReply with: \"guide me on step 2\" and I will give the exact CRM checklist for your current data.`
}

export const buildFallbackResponse = (mode: FallbackMode, prompt: string, context: unknown, userName = "there") => {
  if (mode === "email") {
    const details = (context || {}) as EmailContext
    const recipient = details.recipient || "the client"
    const tone = details.tone || "professional"
    const goal = details.goal || "follow up"
    const extra = details.context ? `Context: ${details.context}\n\n` : ""
    return `Subject: Quick update on ${goal}\n\nHi ${recipient},\n\n${extra}I wanted to ${goal.toLowerCase()}. Here is a quick update and the next step I recommend:\n\n- Status: In progress\n- Next action: Confirm timeline and dependencies\n\nLet me know if you'd like me to adjust anything.\n\nBest,\n${userName}\nTone: ${tone}`
  }

  if (mode === "summary") {
    const summary = (context || {}) as SummaryContext
    const stats = summary.stats || {}
    const decisions = summary.decisions || []
    const activity = summary.recentActivity || []
    const statLine = Object.entries(stats)
      .slice(0, 5)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ")
    const decisionLine = decisions.length
      ? decisions.slice(0, 3).map((item) => `• ${item.title} (${item.detail})`).join("\n")
      : "• No urgent decisions right now."
    const activityLine = activity.length
      ? activity.slice(0, 3).map((item) => `• ${item.title}${item.detail ? ` — ${item.detail}` : ""}`).join("\n")
      : "• No recent activity yet."
    return `Here is your Civis snapshot:\n\nTop stats: ${statLine || "No data yet."}\n\nPriority decisions:\n${decisionLine}\n\nRecent activity:\n${activityLine}\n\nWant me to generate follow-up tasks or draft an update email?`
  }

  if (mode === "tour") {
    return buildSmartTour(prompt, context, userName)
  }

  const knowledge = findKnowledge(prompt)
  if (knowledge) {
    return `${knowledge.content}\n\nWant a step-by-step guide or a quick video demo?`
  }

  if (/^(yes|yeah|yep|ok|okay|sure|go ahead|continue)\b/i.test(prompt.trim())) {
    return `Great. Tell me the exact action and I’ll do it now. Example: "show employee count", "generate follow-up tasks", or "take me to CRM".`
  }

  if (/^(no|nope|nah|not now|later|skip)\b/i.test(prompt.trim())) {
    return `No problem. Tell me what you want instead and I’ll adapt.`
  }

  if (/^(1|2|3|4)$/.test(prompt.trim())) {
    if (prompt.trim() === "1") return "Sure. I can show your live snapshot now."
    if (prompt.trim() === "2") return "Sure. I can generate follow-up tasks. Say: \"generate follow-up tasks now\"."
    if (prompt.trim() === "3") return "Sure. Tell me the recipient and topic for the email."
    return "Sure. Tell me which module to open: CRM, Accounting, HR, Operations, or Portal."
  }

  if (/(say|tell|give).*(something )?(unique|different|special|fresh)|something unique/i.test(prompt.trim())) {
    return `Civis is your quiet operator, ${userName}: while others chase dashboards, you run decisions. Ask me for one command and I’ll turn it into action, owner, and deadline.`
  }

  return `I can help right away. Ask naturally, for example: "How many employees do we have?", "Generate follow-up tasks", "Draft an email to our CFO", or "Take me to Accounting".`
}
