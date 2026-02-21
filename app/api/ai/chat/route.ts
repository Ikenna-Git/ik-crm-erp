import { NextResponse } from "next/server"
import { resolveProvider, callProvider, type AiMessage } from "@/lib/ai/providers"
import { buildFallbackResponse } from "@/lib/ai/fallback"
import { findKnowledge } from "@/lib/ai/knowledge"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { prisma } from "@/lib/prisma"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

type AiMode = "qna" | "summary" | "email" | "tour"
type AiAction = {
  type: "navigate"
  route: string
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
    `You are Civis AI, a smart assistant for the Civis CRM/ERP platform. ` +
    `Help users manage business operations: query live data, generate tasks/emails, navigate modules, and guide actions. ` +
    `Be concise, conversational, and practical like a trusted colleague. Detect intent despite typos and shorthand. ` +
    `Maintain context across turns. Interpret shorthand and typos naturally. ` +
    `For unclear inputs, ask one clarifying question instead of resetting to a full menu. ` +
    `Respect sensitive data locks for HR/payroll and finance totals; if locked, explain what to unlock. ` +
    `You may use light, tasteful humor sometimes when the moment is low-stakes and conversational. ` +
    `Avoid humor for security, payroll, legal, or incident scenarios. ` +
    `Use NGN for currency and keep responses under 180 words unless asked for more. Address the user as ${userName}.`
  const modePrompt = {
    qna: "Answer questions about Civis features and best practices. Offer next steps.",
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
    selector: "[data-ai-anchor='overview-header']",
    title: "Overview",
    message: "This is your business pulse. Start here to see risks and priorities.",
  },
  crm: {
    type: "navigate",
    route: "/dashboard/crm",
    selector: "[data-ai-anchor='crm-header']",
    title: "CRM",
    message: "CRM is where you manage contacts, companies, and deal movement.",
  },
  accounting: {
    type: "navigate",
    route: "/dashboard/accounting",
    selector: "[data-ai-anchor='accounting-header']",
    title: "Accounting",
    message: "Accounting is where invoices, expenses, reports, and exports live.",
  },
  hr: {
    type: "navigate",
    route: "/dashboard/hr",
    selector: "[data-ai-anchor='hr-header']",
    title: "HR",
    message: "HR handles employees, payroll controls, attendance, and leave tracking.",
  },
  operations: {
    type: "navigate",
    route: "/dashboard/operations",
    selector: "[data-ai-anchor='operations-header']",
    title: "Operations",
    message: "Operations manages workflows, webhooks, and playbook execution.",
  },
  portal: {
    type: "navigate",
    route: "/dashboard/portal",
    selector: "[data-ai-anchor='portal-header']",
    title: "Client Portal",
    message: "Client Portal is where you share status updates and documents.",
  },
}

const detectNavigationAction = (prompt: string): AiAction | null => {
  const value = prompt.toLowerCase()
  const asksNavigation = /(take me|go to|open|where is|where can i find|show me where|navigate|how do i find)/.test(value)
  if (!asksNavigation) return null

  if (/(crm|deal|contact|company|pipeline)/.test(value)) return moduleActions.crm
  if (/(accounting|invoice|expense|financial|vat|report)/.test(value)) return moduleActions.accounting
  if (/(hr|employee|payroll|attendance|leave|position)/.test(value)) return moduleActions.hr
  if (/(operations|workflow|playbook|webhook)/.test(value)) return moduleActions.operations
  if (/(portal|client portal|client update|share link)/.test(value)) return moduleActions.portal
  return moduleActions.overview
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
    const fallbackEmail = request.headers.get("x-user-email")?.trim() || process.env.DEFAULT_USER_EMAIL || "ikchils@gmail.com"
    const fallbackName = request.headers.get("x-user-name")?.trim() || fallbackEmail.split("@")[0] || "there"
    let org: { id: string; name: string } = { id: "org-default", name: "Civis" }
    let user: { id: string; name: string; email: string } = {
      id: "user-local",
      name: fallbackName,
      email: fallbackEmail,
    }
    let hasDbUser = false

    try {
      const resolved = await getUserFromRequest(request)
      org = { id: resolved.org.id, name: resolved.org.name }
      user = { id: resolved.user.id, name: resolved.user.name || fallbackName, email: resolved.user.email }
      hasDbUser = true
    } catch (error) {
      console.warn("AI chat user resolution failed, using local fallback user", error)
    }
    const body = await request.json().catch(() => ({}))
    const requestedMode = (body?.mode || "qna") as AiMode
    const incoming = Array.isArray(body?.messages) ? normalizeMessages(body.messages) : []
    const lastUserMessage = [...incoming].reverse().find((msg) => msg.role === "user")?.content || ""
    const previousAssistantMessage = [...incoming].reverse().find((msg) => msg.role === "assistant")?.content || ""
    const hrUnlocked = request.headers.get("x-hr-sensitive-unlocked") === "true"
    const financeUnlocked = request.headers.get("x-finance-sensitive-unlocked") === "true"

    if (requestedMode === "qna") {
      const followupResolution = await resolveConversationFollowup(
        org.id,
        lastUserMessage,
        previousAssistantMessage,
        hasDbUser,
      )
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

      const navigationAction = detectNavigationAction(lastUserMessage)
      if (navigationAction) {
        return NextResponse.json({
          message: `Taking you to ${navigationAction.title}. I will highlight the section when you arrive.`,
          provider: "civis-nav-engine",
          mode: "qna",
          actions: [navigationAction],
        })
      }

      const dataResolution = await resolveDataQuery(org.id, lastUserMessage, hasDbUser, {
        hrUnlocked,
        financeUnlocked,
      })
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
