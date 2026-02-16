"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Send, Wand2, ListChecks, Mail, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { getSessionHeaders } from "@/lib/user-settings"
import { writeAiAssistInstruction, type AiAssistInstruction } from "@/lib/ai-assist"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type ChatAction = AiAssistInstruction

const STORAGE_KEY = "civis_ai_chat"
const quickPrompts = [
  "Guide me through Civis as a new team lead.",
  "Guide me on step 2 (CRM deep dive).",
  "Summarize my CRM pipeline this week.",
  "How do I add a custom field in CRM?",
  "Draft a follow-up email to a lead.",
  "What should I fix first in Ops?",
]

const tourSteps = [
  "Overview: your KPIs, alerts, and daily pulse.",
  "CRM: contacts, companies, deals, custom fields.",
  "Accounting: invoices, expenses, VAT reports, exports.",
  "HR: attendance, payroll controls, leave tracking.",
  "Operations: playbooks, decision trails, webhooks.",
  "Client Portal: share updates and documents securely.",
]

export default function CivisAIPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState("")
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [taskStatus, setTaskStatus] = useState("")
  const [taskLoading, setTaskLoading] = useState(false)
  const [emailDraft, setEmailDraft] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailForm, setEmailForm] = useState({
    recipient: "",
    goal: "",
    tone: "Professional",
    context: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setMessages(parsed)
        }
      } catch (err) {
        console.warn("Failed to load Civis AI history", err)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  const lastAssistantMessage = useMemo(
    () => messages.slice().reverse().find((message) => message.role === "assistant"),
    [messages],
  )

  const sendMessage = async (text: string, mode: "qna" | "summary" | "email" | "tour" = "qna", context?: any) => {
    if (!text.trim()) return
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }]
    setMessages(nextMessages)
    setInput("")
    setSending(true)
    setError("")

    const headers: Record<string, string> = { "Content-Type": "application/json", ...getSessionHeaders() }
    if (typeof window !== "undefined") {
      headers["x-current-path"] = window.location.pathname
      headers["x-hr-sensitive-unlocked"] = localStorage.getItem("civis_payroll_unlocked") === "true" ? "true" : "false"
      headers["x-finance-sensitive-unlocked"] =
        localStorage.getItem("civis_finance_unlocked") === "true" ? "true" : "false"
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: nextMessages, mode, context }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to get response")
      const reply = data?.message || "I’m ready when you are."
      setMessages([...nextMessages, { role: "assistant", content: reply }])

      const actions = Array.isArray(data?.actions) ? (data.actions as ChatAction[]) : []
      const navigateAction = actions.find((item) => item?.type === "navigate" && item.route)
      if (navigateAction && data?.provider === "civis-nav-engine") {
        writeAiAssistInstruction(navigateAction)
        router.push(navigateAction.route)
      }
    } catch (err: any) {
      setError(err?.message || "Civis AI is unavailable right now.")
      setMessages([...nextMessages, { role: "assistant", content: "I ran into an error. Try again in a moment." }])
    } finally {
      setSending(false)
    }
  }

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    setSummary("")
    try {
      const opsRes = await fetch("/api/ops/command", { headers: { ...getSessionHeaders() } })
      const opsData = await opsRes.json().catch(() => ({}))
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          mode: "summary",
          messages: [{ role: "user", content: "Summarize this week's business pulse." }],
          context: {
            stats: opsData?.stats,
            decisions: opsData?.decisions,
            recentActivity: opsData?.recentActivity,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Summary failed")
      setSummary(data?.message || "")
    } catch (err: any) {
      setSummary(err?.message || "Failed to generate summary.")
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleGenerateTasks = async () => {
    setTaskLoading(true)
    setTaskStatus("")
    try {
      const res = await fetch("/api/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to generate follow-ups")
      const created = data?.created
      const skipped = Number(data?.skipped || 0)
      if (data?.simulated) {
        setTaskStatus(
          `Simulated mode: created ${created?.contacts || 0} contact follow-ups and ${created?.deals || 0} stalled deal tasks while DB is offline.`,
        )
        return
      }
      setTaskStatus(
        skipped > 0
          ? `Created ${created?.contacts || 0} contact follow-ups and ${created?.deals || 0} stalled deal tasks. ${skipped} item(s) were skipped safely.`
          : `Created ${created?.contacts || 0} contact follow-ups and ${created?.deals || 0} stalled deal tasks.`,
      )
    } catch (err: any) {
      setTaskStatus(err?.message || "Could not generate follow-up tasks.")
    } finally {
      setTaskLoading(false)
    }
  }

  const handleDraftEmail = async () => {
    setEmailLoading(true)
    setEmailDraft("")
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          mode: "email",
          messages: [{ role: "user", content: emailForm.goal || "Draft a follow-up email." }],
          context: emailForm,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to draft email")
      setEmailDraft(data?.message || "")
    } catch (err: any) {
      setEmailDraft(err?.message || "Could not draft email.")
    } finally {
      setEmailLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Civis AI Concierge
          </h1>
          <p className="text-muted-foreground mt-1">
            Ask questions, generate insights, and automate follow-ups with your branded assistant.
          </p>
        </div>
        <Badge variant="outline" className="bg-transparent">
          AI Assist
        </Badge>
      </div>

      <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Ask Civis AI</CardTitle>
            <CardDescription>Get answers, guidance, or suggested actions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-background p-4 min-h-[320px] max-h-[420px] overflow-auto space-y-3">
              {messages.length === 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt) => (
                      <Button
                        key={prompt}
                        variant="secondary"
                        size="sm"
                        className="bg-muted"
                        onClick={() => sendMessage(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((message, idx) => (
                <div
                  key={`${message.role}-${idx}`}
                  className={`rounded-lg p-3 text-sm ${
                    message.role === "user" ? "bg-primary/10 text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                    {message.role === "user" ? "You" : "Civis AI"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
            {lastAssistantMessage && (
              <p className="text-xs text-muted-foreground">Tip: ask for next steps or a checklist.</p>
            )}

            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Civis AI..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
              />
              <Button onClick={() => sendMessage(input)} disabled={sending}>
                {sending ? "Thinking..." : "Send"}
                <Send className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-primary" />
                Guided Tour
              </CardTitle>
              <CardDescription>Let Civis AI walk a new user through the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="text-sm text-muted-foreground list-decimal ml-4 space-y-2">
                {tourSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Button variant="outline" className="bg-transparent" onClick={() => sendMessage("Give me a tour.", "tour")}>
                Start AI tour
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Pulse Summary
              </CardTitle>
              <CardDescription>Generate a weekly executive summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="bg-transparent" onClick={handleGenerateSummary} disabled={summaryLoading}>
                {summaryLoading ? "Generating..." : "Generate summary"}
              </Button>
              {summary && <p className="text-sm whitespace-pre-wrap">{summary}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-primary" />
                Smart Follow-ups
              </CardTitle>
              <CardDescription>Create tasks based on inactivity and stalled deals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="bg-transparent" onClick={handleGenerateTasks} disabled={taskLoading}>
                {taskLoading ? "Generating..." : "Generate follow-up tasks"}
              </Button>
              {taskStatus && <p className="text-sm text-muted-foreground">{taskStatus}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Draft Email
              </CardTitle>
              <CardDescription>Generate professional emails with context.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={emailForm.recipient}
                onChange={(e) => setEmailForm({ ...emailForm, recipient: e.target.value })}
                placeholder="Recipient name"
              />
              <Input
                value={emailForm.goal}
                onChange={(e) => setEmailForm({ ...emailForm, goal: e.target.value })}
                placeholder="Goal (e.g. follow up on invoice)"
              />
              <Input
                value={emailForm.tone}
                onChange={(e) => setEmailForm({ ...emailForm, tone: e.target.value })}
                placeholder="Tone (e.g. friendly, firm)"
              />
              <Textarea
                value={emailForm.context}
                onChange={(e) => setEmailForm({ ...emailForm, context: e.target.value })}
                placeholder="Optional context for the email"
              />
              <Button variant="outline" className="bg-transparent" onClick={handleDraftEmail} disabled={emailLoading}>
                {emailLoading ? "Drafting..." : "Draft email"}
              </Button>
              {emailDraft && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{emailDraft}</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
