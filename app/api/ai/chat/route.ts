import { NextResponse } from "next/server"
import { resolveProvider, callProvider, type AiMessage } from "@/lib/ai/providers"
import { buildFallbackResponse } from "@/lib/ai/fallback"
import { findKnowledge } from "@/lib/ai/knowledge"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"
import { hasModuleAccess } from "@/lib/access-control"
import { isPrivacyUnlocked } from "@/lib/privacy-lock"

type AiMode = "qna" | "summary" | "email" | "tour"
type AiAction = {
  type: "navigate" | "logout"
  route?: string
  href?: string
  label?: string
  selector?: string
  title?: string
  message?: string
}

type TourContext = {
  role: string
  phase: string
  stats: {
    contacts: number
    openDeals: number
    overdueInvoices: number
    pendingExpenses: number
    employees: number
    activePlaybooks: number
    activeAutomations: number
    activePortals: number
  }
}

type DataResolution = {
  message: string
  action?: AiAction
}

type CommandRoute = {
  match: RegExp
  action: AiAction
  requiresAdmin?: boolean
  requiresModule?: Parameters<typeof hasModuleAccess>[1]
}

const isDev = process.env.NODE_ENV !== "production"
// Keep model-first behavior by default. Local rule-based QnA is opt-in only.
const fastLocalQna = process.env.AI_FAST_LOCAL_QNA === "true"
const aiRateLimitPerMinute = Number(process.env.AI_RATE_LIMIT_PER_MIN || "300")

const demoSnapshot = {
  employees: 24,
  contacts: 134,
  openDeals: 18,
  overdueInvoices: 4,
  pendingExpenses: 6,
  revenue: 13256871,
  expenses: 7800000,
  activePortals: 5,
}

const normalizeMessages = (messages: any[]): AiMessage[] =>
  messages
    .filter((message) => message && typeof message.content === "string" && typeof message.role === "string")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : message.role === "system" ? "system" : "user",
      content: message.content,
    }))

const buildSystemPrompt = (mode: AiMode, userName: string, orgName: string, knowledge?: string) => {
  const base =
    `You are Civis Guide — the intelligent, proactive AI co-pilot inside Civis CRM & ERP. ` +
    `Your job is to help users navigate the platform, understand features, and guide them step-by-step on what to do next. ` +
    `Be clear, confident, action-oriented, professional, calm, concise, and practical. ` +
    `Always prioritise the user's goal over listing features. ` +
    `Tell users exactly where to click when guidance is needed, and use numbered steps when it helps. ` +
    `Ask one clarifying question at a time if the user is stuck. ` +
    `Do not pretend an action completed unless Civis actually performed it. ` +
    `Respect role boundaries, org boundaries, and privacy locks for HR/payroll and Accounting. ` +
    `If HR or Accounting is locked, explain the lock clearly and only guide authorized users toward the correct module PIN unlock. ` +
    `Keep responses concise but complete, and usually end with a useful next-step question. ` +
    `Use NGN for currency and address the user as ${userName}.`
  const modePrompt = {
    qna: "Answer questions about Civis features and best practices with direct navigation guidance and useful next steps.",
    summary: "Summarize the provided business metrics and suggest 1-2 next actions.",
    email: "Draft a professional email based on the provided context. Include a clear subject line.",
    tour:
      "Give a smart guided tour of Civis modules in numbered steps with exact module names, what to click, what to check, and the next action.",
  }[mode]

  const knowledgeBlock = knowledge ? `\nRelevant Civis context: ${knowledge}` : ""
  return `${base}\n${modePrompt}${knowledgeBlock}\nOrg: ${orgName || "Civis"}.`
}

const inferModeFromPrompt = (requestedMode: AiMode, prompt: string): AiMode => {
  if (requestedMode !== "qna") return requestedMode
  const value = prompt.toLowerCase()
  if (/(tour|guide me|walk me through|show me around|onboard)/.test(value)) return "tour"
  if (/(draft|write).*(email|follow-up)|email draft/.test(value)) return "email"
  if (/(summary|summarize|snapshot|recap|overview)/.test(value)) return "summary"
  return "qna"
}

const shouldFallbackFromWeakProviderReply = (mode: AiMode, prompt: string, reply: string) => {
  const text = reply.trim()
  if (!text) return true

  const lowerReply = text.toLowerCase()
  const lowerPrompt = prompt.toLowerCase()
  if (mode !== "tour") {
    // For QnA/email/summary, trust model output unless it's effectively empty.
    return text.length < 8
  }

  const hasNumberedSteps = /(^|\n)\s*\d+[.)]\s+/.test(text)
  const moduleMentions = ["overview", "crm", "accounting", "hr", "operations", "portal"].filter((module) =>
    lowerReply.includes(module),
  ).length
  const askedForTour = /(tour|guide me|walk me through|show me around|onboard)/.test(lowerPrompt)

  if (!hasNumberedSteps || moduleMentions < 3) return askedForTour
  return false
}

const inferRoleFromPrompt = (prompt: string) => {
  const value = prompt.toLowerCase()
  if (/(sales|crm|deal|lead)/.test(value)) return "Sales lead"
  if (/(finance|account|invoice|expense|cash)/.test(value)) return "Finance lead"
  if (/(hr|people|payroll|attendance|leave)/.test(value)) return "HR lead"
  if (/(ops|operation|workflow|automation|webhook)/.test(value)) return "Operations lead"
  if (/(ceo|founder|executive|owner)/.test(value)) return "Executive"
  return "Team lead"
}

const loadTourContext = async (orgId: string, prompt: string, enabled: boolean): Promise<TourContext | null> => {
  if (!enabled) return null
  try {
    const [
      contacts,
      openDeals,
      overdueInvoices,
      pendingExpenses,
      employees,
      activePlaybooks,
      activeAutomations,
      activePortals,
    ] = await Promise.all([
      prisma.contact.count({ where: { orgId } }),
      prisma.deal.count({ where: { orgId, stage: { notIn: ["WON", "LOST"] } } }),
      prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
      prisma.expense.count({ where: { orgId, status: "PENDING" } }),
      prisma.employee.count({ where: { orgId } }),
      prisma.playbookRun.count({ where: { orgId, status: "ACTIVE" } }),
      prisma.automationWorkflow.count({ where: { orgId, active: true } }),
      prisma.clientPortal.count({ where: { orgId, status: "ACTIVE" } }),
    ])

    return {
      role: inferRoleFromPrompt(prompt),
      phase: "onboarding",
      stats: {
        contacts,
        openDeals,
        overdueInvoices,
        pendingExpenses,
        employees,
        activePlaybooks,
        activeAutomations,
        activePortals,
      },
    }
  } catch (error) {
    console.warn("Failed to load tour context", error)
    return null
  }
}

const formatNaira = (value: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value)

const moduleActions: Record<string, AiAction> = {
  overview: {
    type: "navigate",
    route: "/dashboard",
    href: "/dashboard",
    label: "Open Overview",
    selector: "[data-ai-anchor='overview-header']",
    title: "Overview",
    message: "This is your business pulse. Start here to see risks and priorities.",
  },
  crm: {
    type: "navigate",
    route: "/dashboard/crm",
    href: "/dashboard/crm",
    label: "Open CRM",
    selector: "[data-ai-anchor='crm-header']",
    title: "CRM",
    message: "CRM is where you manage contacts, companies, and deal movement.",
  },
  accounting: {
    type: "navigate",
    route: "/dashboard/accounting",
    href: "/dashboard/accounting",
    label: "Open Accounting",
    selector: "[data-ai-anchor='accounting-header']",
    title: "Accounting",
    message: "Accounting is where invoices, expenses, reports, and exports live.",
  },
  hr: {
    type: "navigate",
    route: "/dashboard/hr",
    href: "/dashboard/hr",
    label: "Open HR",
    selector: "[data-ai-anchor='hr-header']",
    title: "HR",
    message: "HR handles employees, payroll controls, attendance, and leave tracking.",
  },
  operations: {
    type: "navigate",
    route: "/dashboard/operations",
    href: "/dashboard/operations",
    label: "Open Operations",
    selector: "[data-ai-anchor='operations-header']",
    title: "Operations",
    message: "Operations manages workflows, webhooks, and playbook execution.",
  },
  portal: {
    type: "navigate",
    route: "/dashboard/portal",
    href: "/dashboard/portal",
    label: "Open Client Portal",
    selector: "[data-ai-anchor='portal-header']",
    title: "Client Portal",
    message: "Client Portal is where you share status updates and documents.",
  },
  gallery: {
    type: "navigate",
    route: "/dashboard/gallery",
    href: "/dashboard/gallery",
    label: "Open Gallery",
    title: "Gallery",
    message: "Gallery is where you manage uploaded media, proposals, and client-ready assets.",
  },
  inventory: {
    type: "navigate",
    route: "/dashboard/inventory",
    href: "/dashboard/inventory",
    label: "Open Inventory",
    title: "Inventory",
    message: "Inventory tracks products, stock levels, and purchase flow readiness.",
  },
  settings: {
    type: "navigate",
    route: "/dashboard/settings",
    href: "/dashboard/settings",
    label: "Open Settings",
    title: "Settings",
    message: "Settings is where you manage profile, workspace, notifications, and admin invitations.",
  },
  marketing: {
    type: "navigate",
    route: "/dashboard/marketing",
    href: "/dashboard/marketing",
    label: "Open Marketing",
    title: "Marketing",
    message: "Marketing is currently preview-only, so I will take you there with the right expectations.",
  },
  projects: {
    type: "navigate",
    route: "/dashboard/projects",
    href: "/dashboard/projects",
    label: "Open Projects",
    title: "Projects",
    message: "Projects is where you track delivery work, tasks, and deadlines.",
  },
  pricing: {
    type: "navigate",
    route: "/pricing",
    href: "/pricing",
    label: "Open Pricing",
    title: "Pricing",
    message: "Opening Pricing. Public self-serve checkout is not live yet, but you can review plans and start sign-up.",
  },
  admin: {
    type: "navigate",
    route: "/admin",
    href: "/admin",
    label: "Open Admin",
    title: "Admin",
    message: "Opening Admin. Founder-only platform controls stay locked unless your role permits them.",
  },
}

const commandRoutes: CommandRoute[] = [
  { match: /\b(pricing|plan|plans|billing)\b/, action: moduleActions.pricing },
  { match: /\b(gallery|media|assets)\b/, action: moduleActions.gallery, requiresModule: "gallery" },
  { match: /\b(crm|contacts?|companies?|deals?)\b/, action: moduleActions.crm, requiresModule: "crm" },
  { match: /\b(sales pipeline|pipeline)\b/, action: { ...moduleActions.crm, message: "Opening CRM. Start on the Deals board to review your sales pipeline." }, requiresModule: "crm" },
  { match: /\b(accounting|invoice|invoices|expense|expenses|finance)\b/, action: moduleActions.accounting, requiresModule: "accounting" },
  { match: /\b(hr|employee|employees|payroll|attendance|leave)\b/, action: { ...moduleActions.hr, message: "Opening HR. Payroll controls sit inside the HR workspace." }, requiresModule: "hr" },
  { match: /\b(inventory|stock|product|products)\b/, action: moduleActions.inventory, requiresModule: "inventory" },
  { match: /\b(marketing|campaign|campaigns)\b/, action: moduleActions.marketing, requiresModule: "marketing" },
  { match: /\b(operations|playbooks?|workflow|workflows|webhooks?)\b/, action: moduleActions.operations, requiresModule: "operations" },
  { match: /\b(portal|client portal)\b/, action: moduleActions.portal, requiresModule: "portal" },
  { match: /\b(settings|preferences|workspace settings|profile settings)\b/, action: moduleActions.settings, requiresModule: "settings" },
  { match: /\b(project|projects|tasks?)\b/, action: moduleActions.projects, requiresModule: "projects" },
  { match: /\badmin\b/, action: moduleActions.admin, requiresAdmin: true, requiresModule: "admin" },
]

const getNavigationGuardFailure = (
  action: CommandRoute,
  subject: { role?: string | null; accessProfile?: string | null; moduleAccess?: unknown } | null,
) => {
  if (action.requiresAdmin && !subject?.role) {
    return "You need to be signed in before I can open that page."
  }
  if (action.requiresAdmin && !hasModuleAccess(subject || {}, "admin", "view")) {
    return "Admin access is blocked for this account. I can keep you in your workspace, but I won’t bypass permissions."
  }
  if (action.requiresModule && !hasModuleAccess(subject || {}, action.requiresModule, "view")) {
    return "That page is blocked for your current workspace role. Ask a workspace admin if you need access."
  }
  return null
}

const detectNavigationAction = (
  prompt: string,
  subject: { role?: string | null; accessProfile?: string | null; moduleAccess?: unknown } | null,
): DataResolution | null => {
  const value = prompt.toLowerCase()
  const asksNavigation =
    /(take me|go to|open|where is|where can i find|show me where|navigate|how do i find|switch to)/.test(value) ||
    /^(overview|dashboard)$/i.test(prompt.trim())
  if (!asksNavigation) return null

  if (/^(overview|dashboard)$/i.test(prompt.trim())) {
    return { message: "Opening Overview.", action: moduleActions.overview }
  }

  const match = commandRoutes.find((entry) => entry.match.test(value))
  if (!match) {
    return { message: "I can open Overview, CRM, Accounting, HR, Inventory, Marketing, Gallery, Settings, Pricing, Operations, Projects, or Admin.", action: moduleActions.overview }
  }

  const blockedMessage = getNavigationGuardFailure(match, subject)
  if (blockedMessage) return { message: blockedMessage }

  return {
    message: match.action.message || `Opening ${match.action.title || "that page"}.`,
    action: match.action,
  }
}

const detectLogoutAction = (prompt: string): DataResolution | null => {
  if (!/\b(log ?me out|sign me out|logout|log out)\b/i.test(prompt)) return null
  return {
    message: "I can sign you out safely now.",
    action: {
      type: "logout",
      label: "Sign out",
      title: "Logout",
      message: "Use this action to sign out of Civis securely.",
    },
  }
}

const resolveGuidedHowTo = (prompt: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()

  if (/i('?| a)m lost|i am lost|lost here|where do i start/.test(value)) {
    return {
      message:
        "No problem. What are you trying to accomplish right now?\n\nFor example:\n1. create a contact\n2. send or approve an invoice\n3. check approvals\n4. upload files\n5. set up a workflow\n6. manage users",
    }
  }

  if (/how do i create an invoice|create an invoice|make an invoice/.test(value)) {
    return {
      message:
        "Easy.\n\n1. Go to Accounting → Invoices from the sidebar.\n2. Click New Invoice.\n3. Select a client and add line items.\n4. Save the invoice, then request approval if your workflow requires it.\n\nYou can also create invoice workflows from CRM deals if that is enabled. Would you like me to walk you through a full invoice example?",
      action: moduleActions.accounting,
    }
  }

  if (/unlock accounting|why can('?|’)t i see invoice|why can('?|’)t i see expense|why can('?|’)t i see finance/.test(value)) {
    return {
      message:
        "Accounting is currently privacy locked. If you are authorized, unlock Accounting using the Accounting PIN. If the PIN field is disabled, refresh the page, sign in again, or contact your workspace admin because your role may not be allowed to unlock it. Until then, invoice and expense details stay protected. Would you like me to take you to Accounting now?",
      action: moduleActions.accounting,
    }
  }

  if (/why can('?|’)t i see payroll|unlock hr|unlock payroll/.test(value)) {
    return {
      message:
        "HR is currently privacy locked. If you are authorized, unlock HR using the HR PIN. If the PIN field is disabled, refresh the page, sign in again, or contact your workspace admin because your role may not be allowed to unlock it. Until then, employee and payroll details stay protected. Would you like me to open HR for you now?",
      action: moduleActions.hr,
    }
  }

  if (/what does limited mean|meaning of limited/.test(value)) {
    return {
      message: "Limited means the feature exists, but live evidence is still pending. It should not be treated as launch-approved yet.",
    }
  }

  if (/what does action required mean|meaning of action required/.test(value)) {
    return {
      message: "Action Required means the item still needs manual validation, provider proof, or evidence before launch approval.",
    }
  }

  if (/what does missing mean|meaning of missing/.test(value)) {
    return {
      message: "Missing means a required provider or configuration is not present, so the capability should not be treated as live.",
    }
  }

  if (/what is preview only|what does preview only mean|meaning of preview only/.test(value)) {
    return {
      message: "Preview Only means the feature is intentionally non-production in this release. It should stay honest and must not show fake live success.",
    }
  }

  return null
}

const isAffirmativePrompt = (prompt: string) =>
  /^(yes|yeah|yep|ok|okay|sure|go ahead|please do|do it|continue)\b/i.test(prompt.trim())

const isNegativePrompt = (prompt: string) =>
  /^(no|nope|nah|not now|later|skip|maybe later)\b/i.test(prompt.trim())

const resolveGreetingPrompt = (prompt: string, userName: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  if (!/^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/.test(value)) return null
  const lines = [
    `Hey ${userName}. I’m here. Ask me anything about HR, CRM, accounting, operations, or say "show snapshot".`,
    `Hey ${userName}. Ready when you are. I answer faster than office gossip travels.`,
    `Hi ${userName}. Let’s make the dashboard earn its salary today.`,
  ]
  return {
    message: lines[Math.floor(Math.random() * lines.length)],
  }
}

const resolveLowSignalOrOffTopic = (prompt: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  if (/^(1|2|3|4)$/.test(value)) return null

  if (/(must i pick a number|do i have to pick a number|without number|can i just type)/.test(value)) {
    return {
      message: "No. You can type naturally. Example: \"show employee count\", \"draft email to CFO\", or \"take me to HR\".",
    }
  }

  if (/(are you smart|are you intelligent|can you really help)/.test(value)) {
    return { message: "Yes. Ask naturally and I’ll handle it." }
  }
  if (!value) {
    return {
      message:
        "I didn't catch that. Ask me about CRM, Accounting, HR, Operations, reports, or say \"take me to CRM\".",
    }
  }

  const squashed = value.replace(/\s+/g, "")
  const lowSignal =
    /^(m+|mm+|hmm+|uh+|um+|erm+|asdf+|qwerty+|zxcv+|xxx+|zzz+|kkk+)$/i.test(squashed) ||
    (value.length <= 1 && !/^(hr|crm|ops|ai|ok)$/i.test(value))

  if (lowSignal) {
    return {
      message: "I didn’t catch that clearly. Tell me in one sentence what you want me to do.",
    }
  }

  if (/(you're boring|you are boring|so boring|you are dry|you sound robotic)/.test(value)) {
    return {
      message:
        "Fair call. Let’s make this better: give me one goal and I’ll respond with a sharper, more human answer plus action steps.",
    }
  }

  return null
}

const resolveHighlightPreference = (prompt: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  if (!/(don'?t highlight|do not highlight|without highlight|no highlight|stop highlighting)/.test(value)) return null

  return {
    message: "Noted. I’ll navigate without highlight unless you ask for it.",
  }
}

const resolveAddIntent = (prompt: string, previousAssistant: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  const employeeAddAsk =
    /(add|create|register).*(employee|staff|team member)/.test(value) ||
    (/(can you add|add for me|help me add)/.test(value) && /(employees|hr)/i.test(previousAssistant))

  if (employeeAddAsk) {
    return {
      message:
        "Yes. I can prepare that. Send details in one line:\nName, Email, Role, Department, Start date.\nExample: Ada Obi, ada@civis.com, HR Manager, HR, 2026-02-20.",
      action: moduleActions.hr,
    }
  }

  return null
}

const resolveEmailClarification = (prompt: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  const asksEmail = /(draft|write|compose).*(email|mail)|email/.test(value)
  if (!asksEmail) return null

  const hasRecipientHint =
    /(to\s+[a-z0-9@._-]+)|\b(cfo|ceo|hr|finance|ops|team|client|customer|vendor|manager)\b/.test(value)
  const hasTopicHint =
    /(about|re:|regarding|subject|invoice|overdue|payroll|leave|follow[- ]?up|update|onboarding|meeting)/.test(value)

  if (hasRecipientHint && hasTopicHint) return null

  return {
    message:
      "Sure. I can draft it properly. Send:\n1) recipient (person/team)\n2) topic\n3) tone (optional)\n\nExample: \"Draft email to HR team about leave reminders, tone friendly.\"",
  }
}

const resolveCreativePrompt = (prompt: string, userName: string): DataResolution | null => {
  const value = prompt.trim().toLowerCase()
  const asksUnique =
    /(say|tell|give).*(something )?(unique|different|special|fresh)/.test(value) ||
    /something unique/.test(value)

  if (!asksUnique) return null

  return {
    message:
      `Civis is your quiet operator, ${userName}: while others chase dashboards, you run decisions. ` +
      `Ask me for one command and I’ll turn it into action, owner, and deadline.`,
  }
}

const humorRequested = (prompt: string) =>
  /(joke|funny|humor|humorous|make me laugh|be witty|roast|banter)/i.test(prompt)

const humorAllowedForPrompt = (prompt: string) => {
  const value = prompt.toLowerCase()
  if (/(payroll|salary|security|breach|incident|fraud|legal|compliance|paye|pension|tax|audit)/.test(value)) {
    return false
  }
  return true
}

const addHumorLineIfSuitable = (reply: string, prompt: string, mode: AiMode) => {
  if (mode !== "qna") return reply
  if (!reply.trim()) return reply
  if (!humorAllowedForPrompt(prompt)) return reply

  const explicit = humorRequested(prompt)
  const occasional = Math.random() < 0.2
  if (!explicit && !occasional) return reply

  const oneLiners = [
    "Bonus tip: clean data closes deals; chaos only closes laptops.",
    "Small daily updates beat heroic monthly cleanup every time.",
    "If dashboards could clap, this one would.",
    "Good ops is boring in the best possible way.",
  ]
  const line = oneLiners[Math.floor(Math.random() * oneLiners.length)]
  return `${reply}\n\n${line}`
}

const resolveConversationFollowup = async (
  orgId: string,
  prompt: string,
  previousAssistant: string,
  enabled: boolean,
): Promise<DataResolution | null> => {
  if (!previousAssistant.trim()) return null

  const lowerAssistant = previousAssistant.toLowerCase()
  const askedForFollowupOrEmail =
    lowerAssistant.includes("generate follow-up tasks") || lowerAssistant.includes("draft an update email")
  const askedForGuideOrVideo =
    lowerAssistant.includes("step-by-step guide") ||
    lowerAssistant.includes("quick video demo") ||
    lowerAssistant.includes("video demo")

  if (isNegativePrompt(prompt)) {
    if (askedForGuideOrVideo) {
      return {
        message:
          "No problem. I won’t start the guide. If you want, I can do one of these instead: 1) quick Ops summary, 2) jump to CRM, 3) draft an update email.",
      }
    }

    if (askedForFollowupOrEmail) {
      return {
        message:
          "Understood. I won’t run that action. Tell me what you want next: live counts, module navigation, summary, or email draft.",
      }
    }

    return {
      message:
        "No problem. Tell me the exact action you want instead (for example: \"show employee count\" or \"take me to Operations\").",
    }
  }

  if (!isAffirmativePrompt(prompt)) return null

  if (askedForFollowupOrEmail) {
    if (!enabled) {
      return {
        message:
          "Great. I can proceed. Choose one: 1) generate follow-up tasks, 2) draft an update email. (Connect DB first for live task generation.)",
      }
    }

    const [inactiveContacts, stalledDeals] = await Promise.all([
      prisma.contact.count({ where: { orgId, lastContact: null } }),
      prisma.deal.count({ where: { orgId, stage: { in: ["PROPOSAL", "NEGOTIATION"] } } }),
    ])

    return {
      message: `Great. I can proceed right now.\n\nOption 1: generate follow-up tasks (${inactiveContacts} inactive contacts, ${stalledDeals} stalled deals detected).\nOption 2: draft an update email.\n\nReply with:\n- \"generate follow-up tasks\"\nor\n- \"draft update email\"`,
      action: moduleActions.crm,
    }
  }

  if (lowerAssistant.includes("tell me which section")) {
    return {
      message:
        "Perfect. Start with Overview first, then CRM. If you want, reply: \"guide me on step 1\" and I will walk you click-by-click.",
      action: moduleActions.overview,
    }
  }

  if (askedForGuideOrVideo) {
    const opsOrOverviewAction =
      lowerAssistant.includes("ops command center") || lowerAssistant.includes("operations")
        ? moduleActions.operations
        : moduleActions.overview

    return {
      message:
        "Perfect. Starting the step-by-step guide now.\n\nStep 1:\n- Open the highlighted module.\n- Review the top risk card first (overdue, pending, stalled, or overdue tasks).\n- Click the top card and assign owner + due date.\n\nWhen done, reply \"next step\" and I will continue with Step 2. If you prefer video-style notes, reply \"video demo\".",
      action: opsOrOverviewAction,
    }
  }

  return {
    message:
      "I’m with you. Tell me the exact action you want next (for example: \"show employee count\", \"generate follow-up tasks\", or \"take me to accounting\").",
  }
}

const resolveDataQuery = async (
  orgId: string,
  prompt: string,
  enabled: boolean,
  lockState: { hrUnlocked: boolean; financeUnlocked: boolean },
): Promise<DataResolution | null> => {
  const value = prompt.toLowerCase()
  const looksLikeDataQuery =
    /(how many|count|number of|total|what is|what's|show.*data|give.*data|stats|figures|snapshot)/.test(value) ||
    /(employees|contacts|deals|invoices|expenses|revenue|profit|payroll|headcount|portal)/.test(value)

  if (!looksLikeDataQuery) return null
  if (!enabled) {
    if (/(employee|employees|headcount|staff)/.test(value)) {
      return {
        message: `Live DB is currently offline. Based on your working snapshot, you have about ${demoSnapshot.employees} employees.`,
        action: moduleActions.hr,
      }
    }

    if (/(contact|contacts)/.test(value)) {
      return {
        message: `Live DB is offline. Snapshot shows about ${demoSnapshot.contacts} contacts in CRM.`,
        action: moduleActions.crm,
      }
    }

    if (/(deal|pipeline)/.test(value)) {
      return {
        message: `Live DB is offline. Snapshot shows about ${demoSnapshot.openDeals} open deals in pipeline.`,
        action: moduleActions.crm,
      }
    }

    if (/(invoice|invoices|overdue)/.test(value)) {
      return {
        message: `Live DB is offline. Snapshot shows about ${demoSnapshot.overdueInvoices} overdue invoices.`,
        action: moduleActions.accounting,
      }
    }

    if (/(expense|expenses)/.test(value)) {
      return {
        message: `Live DB is offline. Snapshot shows about ${demoSnapshot.pendingExpenses} pending expenses.`,
        action: moduleActions.accounting,
      }
    }

    if (/(revenue|profit|cashflow|financial|vat|margin|expense total|total expenses)/.test(value)) {
      const profit = demoSnapshot.revenue - demoSnapshot.expenses
      return {
        message: `Live DB is offline. Snapshot finance: revenue ${formatNaira(demoSnapshot.revenue)}, expenses ${formatNaira(demoSnapshot.expenses)}, net ${formatNaira(profit)}.`,
        action: moduleActions.accounting,
      }
    }

    return {
      message: `Live DB is offline right now. Snapshot: employees ${demoSnapshot.employees}, contacts ${demoSnapshot.contacts}, open deals ${demoSnapshot.openDeals}, overdue invoices ${demoSnapshot.overdueInvoices}, pending expenses ${demoSnapshot.pendingExpenses}.`,
      action: moduleActions.overview,
    }
  }

  const asksPayrollSensitive = /(payroll|salary|net pay|deduction|bonus|compensation|paye|pension)/.test(value)
  if (asksPayrollSensitive && !lockState.hrUnlocked) {
    return {
      message:
        "That payroll data is locked. Unlock Payroll in HR first, then ask again and I will return the numbers.",
      action: moduleActions.hr,
    }
  }

  const asksFinanceSensitive =
    /(revenue|profit|cashflow|vat|invoice amount|financial report|expense total|total expenses|margin)/.test(value)
  if (asksFinanceSensitive && !lockState.financeUnlocked) {
    return {
      message:
        "That finance data is locked. Unlock Finance in Accounting first, then ask again and I will return the exact totals.",
      action: moduleActions.accounting,
    }
  }

  if (/(employee|employees|headcount|staff)/.test(value)) {
    const employees = await prisma.employee.count({ where: { orgId } })
    return {
      message: `You currently have ${employees} employee${employees === 1 ? "" : "s"} in HR.`,
      action: moduleActions.hr,
    }
  }

  if (/(contact|contacts)/.test(value)) {
    const contacts = await prisma.contact.count({ where: { orgId } })
    return {
      message: `You currently have ${contacts} CRM contact${contacts === 1 ? "" : "s"}.`,
      action: moduleActions.crm,
    }
  }

  if (/(open deal|active deal|deal|pipeline)/.test(value)) {
    const openDeals = await prisma.deal.count({ where: { orgId, stage: { notIn: ["WON", "LOST"] } } })
    return {
      message: `You currently have ${openDeals} open deal${openDeals === 1 ? "" : "s"} in your pipeline.`,
      action: moduleActions.crm,
    }
  }

  if (/(invoice|invoices|overdue invoice)/.test(value) && !asksFinanceSensitive) {
    const [totalInvoices, overdueInvoices] = await Promise.all([
      prisma.invoice.count({ where: { orgId } }),
      prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    ])
    return {
      message: `You have ${totalInvoices} invoice${totalInvoices === 1 ? "" : "s"} total, with ${overdueInvoices} overdue.`,
      action: moduleActions.accounting,
    }
  }

  if (/(expense|expenses)/.test(value) && !asksFinanceSensitive) {
    const [totalExpenses, pendingExpenses] = await Promise.all([
      prisma.expense.count({ where: { orgId } }),
      prisma.expense.count({ where: { orgId, status: "PENDING" } }),
    ])
    return {
      message: `You have ${totalExpenses} expense record${totalExpenses === 1 ? "" : "s"} with ${pendingExpenses} pending approval.`,
      action: moduleActions.accounting,
    }
  }

  if (/(revenue|profit|cashflow|financial|vat|margin|expense total|total expenses)/.test(value)) {
    const [paidRevenueAgg, expenseAgg, overdueInvoices] = await Promise.all([
      prisma.invoice.aggregate({ where: { orgId, status: "PAID" }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { orgId }, _sum: { amount: true } }),
      prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    ])
    const revenue = paidRevenueAgg._sum.amount || 0
    const expenses = expenseAgg._sum.amount || 0
    const profit = revenue - expenses
    return {
      message: `Finance snapshot: paid revenue ${formatNaira(revenue)}, expenses ${formatNaira(expenses)}, net ${formatNaira(profit)}, overdue invoices ${overdueInvoices}.`,
      action: moduleActions.accounting,
    }
  }

  if (/(portal|client portal)/.test(value)) {
    const activePortals = await prisma.clientPortal.count({ where: { orgId, status: "ACTIVE" } })
    return {
      message: `You currently have ${activePortals} active client portal${activePortals === 1 ? "" : "s"}.`,
      action: moduleActions.portal,
    }
  }

  const [employees, contacts, openDeals, overdueInvoices, pendingExpenses] = await Promise.all([
    prisma.employee.count({ where: { orgId } }),
    prisma.contact.count({ where: { orgId } }),
    prisma.deal.count({ where: { orgId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    prisma.expense.count({ where: { orgId, status: "PENDING" } }),
  ])

  return {
    message: `Live snapshot: employees ${employees}, contacts ${contacts}, open deals ${openDeals}, overdue invoices ${overdueInvoices}, pending expenses ${pendingExpenses}.`,
    action: moduleActions.overview,
  }
}

const resolvePageKey = (currentPath: string) => {
  if (currentPath.startsWith("/dashboard/crm")) return "crm"
  if (currentPath.startsWith("/dashboard/accounting")) return "accounting"
  if (currentPath.startsWith("/dashboard/hr")) return "hr"
  if (currentPath.startsWith("/dashboard/operations")) return "operations"
  if (currentPath.startsWith("/dashboard/gallery")) return "gallery"
  if (currentPath.startsWith("/dashboard/marketing")) return "marketing"
  if (currentPath.startsWith("/dashboard/settings")) return "settings"
  if (currentPath.startsWith("/dashboard/portal")) return "portal"
  if (currentPath.startsWith("/dashboard/projects")) return "projects"
  if (currentPath.startsWith("/dashboard/ai")) return "ai"
  if (currentPath.startsWith("/admin")) return "admin"
  return "overview"
}

const resolvePageHelp = ({
  currentPath,
  hrUnlocked,
  financeUnlocked,
  hasAiProvider,
}: {
  currentPath: string
  hrUnlocked: boolean
  financeUnlocked: boolean
  hasAiProvider: boolean
}): { canDo: string; blocked: string; setup: string; next: string; action?: AiAction } => {
  const pageKey = resolvePageKey(currentPath)
  switch (pageKey) {
    case "crm":
      return {
        canDo: "You can add contacts, companies, and deals, review pipeline health, export CRM reports, and trigger follow-up generation.",
        blocked: "If follow-up automation or deeper AI help is unavailable, Civis should say so clearly instead of inventing tasks.",
        setup: "Start by adding contacts or importing a CSV, then create one company and one deal to unlock a meaningful pipeline view.",
        next: "Review stale contacts, move active deals forward, and export the CRM snapshot if leadership needs an update.",
        action: moduleActions.crm,
      }
    case "accounting":
      return {
        canDo: "You can review invoices, expenses, approvals, and report packs for this workspace.",
        blocked: financeUnlocked
          ? "Anything blocked here is more likely a provider or release limitation, not a finance privacy lock."
          : "Amounts, exports, approvals, and detail views stay privacy locked until an authorized manager unlocks Accounting for this session.",
        setup: "Record one invoice and one expense, then run the approval flow before trusting exports or summaries.",
        next: "Check overdue invoices first, then clear pending expenses and confirm approvals persist after refresh.",
        action: moduleActions.accounting,
      }
    case "hr":
      return {
        canDo: "You can review employees, payroll, attendance, positions, and compliance packs from this page.",
        blocked: hrUnlocked
          ? "Anything blocked here is likely a release or configuration gap, not an HR privacy lock."
          : "Employee contact details, payroll amounts, exports, and row-level actions stay privacy locked until an authorized manager unlocks HR for this session.",
        setup: "Add one employee, one payroll record, and one attendance record to validate that the HR workspace is grounded in real data.",
        next: "Verify employee directory quality first, then review payroll and attendance before inviting more HR operators.",
        action: moduleActions.hr,
      }
    case "operations":
      return {
        canDo: "You can monitor approvals, workflows, incidents, compliance packs, and command-centre signals.",
        blocked: "Integrations and saved reports should stay honest if persistence or provider setup is not available yet.",
        setup: "Confirm approval requests persist from Accounting, then verify workflows and webhook visibility with real org-scoped records.",
        next: "Clear pending approvals, review workflow health, and check compliance gaps before launch demos.",
        action: moduleActions.operations,
      }
    case "gallery":
      return {
        canDo: "You can upload media, rename items, share links, and organise customer-facing assets here.",
        blocked: "Uploads fail safely if Cloudinary is not configured. Civis should never fake a successful upload.",
        setup: "Connect Cloudinary first, then upload a single image and verify the file still works after refresh.",
        next: "Add a branded proposal deck or screenshot set so the workspace has real assets for demos.",
        action: moduleActions.gallery,
      }
    case "marketing":
      return {
        canDo: "You can review the marketing release preview, sample campaign structure, and readiness notes.",
        blocked: "Campaign creation, sending, analytics, and template editing are preview-only in this release.",
        setup: "There is no production marketing setup to complete yet. Keep this module framed as a preview during launch.",
        next: "Use CRM and Operations for real launch flows. Treat Marketing as roadmap context only.",
        action: moduleActions.marketing,
      }
    case "settings":
      return {
        canDo: "You can update profile, preferences, notifications, digest timing, and workspace settings that are truly persisted.",
        blocked: "Unsupported security toggles or provider-backed settings should remain visibly non-persistent until the backend exists.",
        setup: "Save profile and workspace name first, then test invites, digest email, and notification preferences with refresh.",
        next: "Use settings to tighten workspace identity, invites, and notifications before customer demos.",
        action: moduleActions.settings,
      }
    case "portal":
      return {
        canDo: "You can publish client updates, manage shared documents, and review portal-level status.",
        blocked: "Portal data should stay org-scoped, and document sharing depends on upload configuration.",
        setup: "Create one client portal, add a summary update, and attach one document after uploads are validated.",
        next: "Use the portal for customer-facing proof after CRM and uploads are already stable.",
        action: moduleActions.portal,
      }
    case "projects":
      return {
        canDo: "You can track tasks, project progress, and deadlines for delivery work.",
        blocked: "Anything blocked here should be a permission or not-in-this-release state, not a fake saved action.",
        setup: "Create one project with one task and one owner so the module has real execution data.",
        next: "Check overdue tasks and link project work back to Ops priorities.",
        action: moduleActions.projects,
      }
    case "ai":
      return {
        canDo: "You can use deterministic navigation, page guidance, setup help, follow-up generation, and provider-backed drafting when configured.",
        blocked: hasAiProvider
          ? "If a provider call fails, Civis should fall back gracefully without pretending the AI action completed."
          : "Generative drafting and richer summaries require an AI provider key. Navigation and setup guidance still work without one.",
        setup: "Configure an AI provider only if you want higher-quality drafting. The deterministic command layer works either way.",
        next: "Try 'take me to gallery', 'what can I do here?', or 'what should I do next?' to validate the AI layer.",
        action: { ...moduleActions.overview, title: "Civis AI" },
      }
    case "admin":
      return {
        canDo: "You can review workspace health, access boundaries, founder-only controls, and launch-readiness signals.",
        blocked: "Founder-only pages and platform APIs stay blocked unless the real founder super-admin is signed in.",
        setup: "Verify org boundaries, route guards, and provider readiness before you trust this for launch or investor demos.",
        next: "Review Trust & Security, then verify the founder/org-owner separation live.",
        action: moduleActions.admin,
      }
    default:
      return {
        canDo: "You can review KPIs, priorities, activity, and launch-readiness signals from the overview.",
        blocked: "Any empty cards here mean the workspace needs more real records or provider validation, not fake sample data.",
        setup: "Finish the onboarding checklist, then add CRM, accounting, and HR records so the dashboard becomes meaningful.",
        next: "Start with the highest-priority Civis Pulse card, then move into CRM or Accounting based on what is blocked.",
        action: moduleActions.overview,
      }
  }
}

const resolvePageCommand = async ({
  currentPath,
  prompt,
  orgId,
  hasDbUser,
  hrUnlocked,
  financeUnlocked,
}: {
  currentPath: string
  prompt: string
  orgId: string
  hasDbUser: boolean
  hrUnlocked: boolean
  financeUnlocked: boolean
}): Promise<DataResolution | null> => {
  const value = prompt.toLowerCase()
  const hasAiProvider = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)
  const help = resolvePageHelp({ currentPath, hrUnlocked, financeUnlocked, hasAiProvider })

  if (/what can i do (here|on this page)|help on this page/.test(value)) {
    return { message: help.canDo, action: help.action }
  }

  if (/what is blocked|what'?s blocked|what is unavailable|why is this blocked/.test(value)) {
    return { message: help.blocked, action: help.action }
  }

  if (/help me set this up|how do i set this up|set this up/.test(value)) {
    return { message: help.setup, action: help.action }
  }

  if (/what should i do next|next best action|what next/.test(value)) {
    return { message: help.next, action: help.action }
  }

  if (!/summari[sz]e this page|summary of this page|summarise this screen|summarize this screen/.test(value)) {
    return null
  }

  if (!hasDbUser) {
    return {
      message: "Live database context is unavailable right now, so I can only summarise the page structure and setup guidance rather than real workspace numbers.",
      action: help.action,
    }
  }

  const pageKey = resolvePageKey(currentPath)
  if (pageKey === "crm") {
    const [contacts, openDeals, companies] = await Promise.all([
      prisma.contact.count({ where: { orgId } }),
      prisma.deal.count({ where: { orgId, stage: { notIn: ["WON", "LOST"] } } }),
      prisma.company.count({ where: { orgId } }),
    ])
    return {
      message: `CRM summary: ${contacts} contacts, ${companies} companies, and ${openDeals} open deals. Use this page to clean records, move pipeline, and generate follow-up work without leaving the workspace.`,
      action: moduleActions.crm,
    }
  }

  if (pageKey === "accounting") {
    const [invoiceCount, overdueInvoices, expenseCount, pendingExpenses] = await Promise.all([
      prisma.invoice.count({ where: { orgId } }),
      prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
      prisma.expense.count({ where: { orgId } }),
      prisma.expense.count({ where: { orgId, status: "PENDING" } }),
    ])
    const lockNote = financeUnlocked ? "" : " Sensitive amounts and exports are still role-locked."
    return {
      message: `Accounting summary: ${invoiceCount} invoices, ${overdueInvoices} overdue, ${expenseCount} expenses, and ${pendingExpenses} pending approval.${lockNote}`,
      action: moduleActions.accounting,
    }
  }

  if (pageKey === "hr") {
    const [employeeCount, payrollCount, attendanceCount, positionCount] = await Promise.all([
      prisma.employee.count({ where: { orgId } }),
      prisma.payrollRecord.count({ where: { orgId } }),
      prisma.attendanceRecord.count({ where: { orgId } }),
      prisma.position.count({ where: { orgId } }),
    ])
    const lockNote = hrUnlocked ? "" : " Payroll and personal employee details remain redacted for this role."
    return {
      message: `HR summary: ${employeeCount} employees, ${payrollCount} payroll records, ${attendanceCount} attendance entries, and ${positionCount} tracked positions.${lockNote}`,
      action: moduleActions.hr,
    }
  }

  if (pageKey === "operations") {
    const [workflowCount, taskCount, portalCount] = await Promise.all([
      prisma.automationWorkflow.count({ where: { orgId } }),
      prisma.task.count({ where: { orgId, status: "OPEN" } }),
      prisma.clientPortal.count({ where: { orgId, status: "ACTIVE" } }),
    ])
    return {
      message: `Operations summary: ${workflowCount} active workflows, ${taskCount} open tasks, and ${portalCount} active client portals. Use this page to monitor approvals, workflow health, and compliance gaps.`,
      action: moduleActions.operations,
    }
  }

  if (pageKey === "gallery") {
    const itemCount = await prisma.galleryItem.count({ where: { orgId } })
    return {
      message: `Gallery summary: ${itemCount} uploaded asset${itemCount === 1 ? "" : "s"} in this workspace. Uploads still depend on Cloudinary configuration being present.`,
      action: moduleActions.gallery,
    }
  }

  if (pageKey === "marketing") {
    return {
      message: "Marketing summary: this module is intentionally preview-only for launch. Use it to explain roadmap direction, not to run live campaigns or sending.",
      action: moduleActions.marketing,
    }
  }

  if (pageKey === "settings") {
    return {
      message: "Settings summary: this page persists profile, preferences, notifications, and supported workspace fields. Unsupported security-style toggles should stay visibly non-persistent until backend support exists.",
      action: moduleActions.settings,
    }
  }

  const [employees, contacts, openDeals, overdueInvoices, pendingExpenses] = await Promise.all([
    prisma.employee.count({ where: { orgId } }),
    prisma.contact.count({ where: { orgId } }),
    prisma.deal.count({ where: { orgId, stage: { notIn: ["WON", "LOST"] } } }),
    prisma.invoice.count({ where: { orgId, status: "OVERDUE" } }),
    prisma.expense.count({ where: { orgId, status: "PENDING" } }),
  ])
  return {
    message: `Overview summary: ${employees} employees, ${contacts} contacts, ${openDeals} open deals, ${overdueInvoices} overdue invoices, and ${pendingExpenses} pending expenses. This is the page to decide what needs attention first.`,
    action: moduleActions.overview,
  }
}

export async function POST(request: Request) {
  try {
    if (Number.isFinite(aiRateLimitPerMinute) && aiRateLimitPerMinute > 0) {
      const limit = rateLimit(getRateLimitKey(request, "ai"), { limit: aiRateLimitPerMinute, windowMs: 60_000 })
      if (!limit.ok) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please wait a moment and try again." },
          { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
        )
      }
    }
    const fallbackEmail = process.env.DEFAULT_USER_EMAIL || "ikchils@gmail.com"
    const fallbackName = fallbackEmail.split("@")[0] || "there"
    let org: { id: string; name: string } = { id: "org-default", name: "Civis" }
    let user: { id: string; name: string; email: string } = {
      id: "user-local",
      name: fallbackName,
      email: fallbackEmail,
    }
    let accessSubject: { role?: string | null; accessProfile?: string | null; moduleAccess?: unknown } | null = null
    let hasDbUser = false

    try {
      const resolved = await getUserFromRequest(request)
      org = { id: resolved.org.id, name: resolved.org.name }
      user = { id: resolved.user.id, name: resolved.user.name || fallbackName, email: resolved.user.email }
      accessSubject = {
        role: resolved.user.role,
        accessProfile: resolved.user.accessProfile,
        moduleAccess: resolved.user.moduleAccess,
      }
      hasDbUser = true
    } catch (error) {
      if (isRequestUserError(error)) {
        if (error.status === 401) {
          return NextResponse.json({ error: error.message }, { status: 401 })
        }
        if (error.status === 503 && isDev) {
          console.warn("AI chat user resolution failed because DB is unavailable; using local fallback user.")
        } else {
          return NextResponse.json({ error: error.message }, { status: error.status })
        }
      } else if (!isDev) {
        return NextResponse.json({ error: "Failed to resolve authenticated user" }, { status: 500 })
      } else {
        console.warn("AI chat user resolution failed, using local fallback user", error)
      }
    }
    const body = await request.json().catch(() => ({}))
    const requestedMode = (body?.mode || "qna") as AiMode
    const incoming = Array.isArray(body?.messages) ? normalizeMessages(body.messages) : []
    const lastUserMessage = [...incoming].reverse().find((msg) => msg.role === "user")?.content || ""
    const previousAssistantMessage = [...incoming].reverse().find((msg) => msg.role === "assistant")?.content || ""
    const currentPath =
      typeof body?.context?.currentPath === "string" && body.context.currentPath
        ? body.context.currentPath
        : request.headers.get("x-current-path") || "/dashboard"
    const hrUnlocked = accessSubject ? hasModuleAccess(accessSubject, "hr", "manage") && isPrivacyUnlocked(request, "hr") : false
    const financeUnlocked = accessSubject
      ? hasModuleAccess(accessSubject, "accounting", "manage") && isPrivacyUnlocked(request, "accounting")
      : false

    if (requestedMode === "qna") {
      const logoutResolution = detectLogoutAction(lastUserMessage)
      if (logoutResolution) {
        return NextResponse.json({
          message: logoutResolution.message,
          provider: "civis-session-engine",
          mode: "qna",
          actions: logoutResolution.action ? [logoutResolution.action] : [],
        })
      }

      const guidedHowTo = resolveGuidedHowTo(lastUserMessage)
      if (guidedHowTo) {
        return NextResponse.json({
          message: guidedHowTo.message,
          provider: "civis-guide",
          mode: "qna",
          actions: guidedHowTo.action ? [guidedHowTo.action] : [],
        })
      }

      let followupResolution: DataResolution | null = null
      try {
        followupResolution = await resolveConversationFollowup(
          org.id,
          lastUserMessage,
          previousAssistantMessage,
          hasDbUser,
        )
      } catch (error) {
        console.warn("Follow-up resolution failed, continuing with model response", error)
      }
      if (followupResolution) {
        return NextResponse.json({
          message: followupResolution.message,
          provider: "civis-context-engine",
          mode: "qna",
          actions: followupResolution.action ? [followupResolution.action] : [],
        })
      }

      const greeting = resolveGreetingPrompt(lastUserMessage, user?.name || "there")
      if (greeting) {
        return NextResponse.json({
          message: greeting.message,
          provider: "civis-greeter",
          mode: "qna",
          actions: [],
        })
      }

      const highlightPreference = resolveHighlightPreference(lastUserMessage)
      if (highlightPreference) {
        return NextResponse.json({
          message: highlightPreference.message,
          provider: "civis-preference-engine",
          mode: "qna",
          actions: [],
        })
      }

      const addIntent = resolveAddIntent(lastUserMessage, previousAssistantMessage)
      if (addIntent) {
        return NextResponse.json({
          message: addIntent.message,
          provider: "civis-action-engine",
          mode: "qna",
          actions: addIntent.action ? [addIntent.action] : [],
        })
      }

      const emailClarification = resolveEmailClarification(lastUserMessage)
      if (emailClarification) {
        return NextResponse.json({
          message: emailClarification.message,
          provider: "civis-email-clarifier",
          mode: "qna",
          actions: [],
        })
      }

      const lowSignalOrOffTopic = resolveLowSignalOrOffTopic(lastUserMessage)
      if (lowSignalOrOffTopic) {
        return NextResponse.json({
          message: lowSignalOrOffTopic.message,
          provider: "civis-clarifier",
          mode: "qna",
          actions: [],
        })
      }

      const creativePrompt = resolveCreativePrompt(lastUserMessage, user?.name || "there")
      if (creativePrompt) {
        return NextResponse.json({
          message: creativePrompt.message,
          provider: "civis-voice",
          mode: "qna",
          actions: [],
        })
      }

      const navigationAction = detectNavigationAction(lastUserMessage, accessSubject)
      if (navigationAction) {
        return NextResponse.json({
          message: navigationAction.message,
          provider: "civis-nav-engine",
          mode: "qna",
          actions: navigationAction.action ? [navigationAction.action] : [],
        })
      }

      const pageCommand = await resolvePageCommand({
        currentPath,
        prompt: lastUserMessage,
        orgId: org.id,
        hasDbUser,
        hrUnlocked,
        financeUnlocked,
      })
      if (pageCommand) {
        return NextResponse.json({
          message: pageCommand.message,
          provider: "civis-command-centre",
          mode: "qna",
          actions: pageCommand.action ? [pageCommand.action] : [],
        })
      }

      let dataResolution: DataResolution | null = null
      try {
        dataResolution = await resolveDataQuery(org.id, lastUserMessage, hasDbUser, {
          hrUnlocked,
          financeUnlocked,
        })
      } catch (error) {
        console.warn("Data resolution failed, continuing with model response", error)
      }
      if (dataResolution) {
        return NextResponse.json({
          message: dataResolution.message,
          provider: "civis-data-engine",
          mode: "qna",
          actions: [],
        })
      }

      if (fastLocalQna) {
        const localReply = buildFallbackResponse("qna", lastUserMessage, body?.context, user?.name || "there")
        return NextResponse.json({
          message: localReply,
          provider: "civis-local-qna",
          mode: "qna",
          actions: [],
        })
      }
    }

    const mode = inferModeFromPrompt(requestedMode, lastUserMessage)
    const tourContext = mode === "tour" ? await loadTourContext(org.id, lastUserMessage, hasDbUser) : null
    let providerPreference =
      typeof body?.provider === "string" && body.provider.trim() ? body.provider.trim() : undefined
    const knowledge = lastUserMessage ? findKnowledge(lastUserMessage)?.content : undefined
    const tourSnapshot =
      mode === "tour" && tourContext
        ? `\nLive org snapshot: contacts ${tourContext.stats.contacts}, open deals ${tourContext.stats.openDeals}, overdue invoices ${tourContext.stats.overdueInvoices}, pending expenses ${tourContext.stats.pendingExpenses}, employees ${tourContext.stats.employees}, active workflows ${tourContext.stats.activeAutomations}, active portals ${tourContext.stats.activePortals}.`
        : ""
    const systemPrompt = `${buildSystemPrompt(mode, user?.name || "there", org?.name || "", knowledge)}${tourSnapshot}`
    const messages: AiMessage[] = [{ role: "system", content: systemPrompt }, ...incoming]
    const mergedContext =
      mode === "tour" ? { ...(body?.context || {}), ...(tourContext || {}) } : body?.context

    if (!providerPreference && process.env.DATABASE_URL && hasDbUser) {
      try {
        const settings = await prisma.userSettings.findUnique({
          where: { userId: user.id },
          select: { aiProvider: true },
        })
        if (settings?.aiProvider) providerPreference = settings.aiProvider
      } catch (error) {
        console.warn("Failed to load AI provider preference", error)
      }
    }

    const provider = resolveProvider(providerPreference)
    let reply = ""
    let resolvedProvider = provider?.provider || "fallback"

    if (mode === "tour") {
      // Keep tours deterministic and high quality even when upstream models respond generically.
      reply = buildFallbackResponse(mode, lastUserMessage, mergedContext, user?.name || "there")
      resolvedProvider = "civis-tour-engine"
    } else {
      try {
        if (provider) {
          reply = await callProvider(provider, messages)
          resolvedProvider = provider.provider
        } else {
          reply = buildFallbackResponse(mode, lastUserMessage, mergedContext, user?.name || "there")
          resolvedProvider = "fallback"
        }
      } catch (error: any) {
        console.error("AI provider failed, using fallback.", error)
        reply = buildFallbackResponse(mode, lastUserMessage, mergedContext, user?.name || "there")
        resolvedProvider = "fallback"
      }

      if (provider && shouldFallbackFromWeakProviderReply(mode, lastUserMessage, reply)) {
        reply = buildFallbackResponse(mode, lastUserMessage, mergedContext, user?.name || "there")
        resolvedProvider = "fallback"
      }
    }

    try {
      if (hasDbUser) {
        await createAuditLog({
          orgId: org.id,
          userId: user.id,
          action: "Civis AI request",
          entity: "AI",
          entityId: `${mode}-${Date.now()}`,
          metadata: { mode },
        })
      }
    } catch (auditError) {
      console.warn("Failed to write AI audit log", auditError)
    }

    const finalReply = addHumorLineIfSuitable(reply, lastUserMessage, mode)

    return NextResponse.json({
      message: finalReply,
      provider: resolvedProvider,
      mode,
      actions: [] as AiAction[],
    })
  } catch (error) {
    console.error("AI chat failed", error)
    const detail = error instanceof Error ? error.message : "Unknown error"
    const message =
      process.env.NODE_ENV === "development" ? `Failed to generate AI response: ${detail}` : "Failed to generate AI response"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
