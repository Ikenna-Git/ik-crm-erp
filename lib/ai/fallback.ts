import { findKnowledge } from "@/lib/ai/knowledge"

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
    return `Welcome to Civis! Here is a quick tour:\n\n1) Overview: your business pulse (KPIs + alerts).\n2) CRM: manage contacts, companies, and deals.\n3) Accounting: invoices, expenses, and VAT-ready reports.\n4) HR: employees, payroll, and attendance.\n5) Operations: playbooks and decision trails.\n6) Client Portal: share updates and documents.\n\nTell me which section you want to explore next.`
  }

  const knowledge = findKnowledge(prompt)
  if (knowledge) {
    return `${knowledge.content}\n\nWant a step-by-step guide or a quick video demo?`
  }

  return `Hi ${userName}! I can help with CRM, accounting, HR, and operations. Ask me to explain a feature, draft an email, or generate follow-up tasks.`
}
