"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bot, Navigation, Send, Sparkles, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AI_ASSIST_EVENT,
  clearAiAssistInstruction,
  readAiAssistInstruction,
  writeAiAssistInstruction,
  type AiAssistInstruction,
} from "@/lib/ai-assist"
import { getSessionHeaders } from "@/lib/user-settings"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

type PageCoach = {
  title: string
  hint: string
  prompts: string[]
}

const CHAT_STORAGE_KEY = "civis_ai_assist_chat_v1"
const OPEN_STORAGE_KEY = "civis_ai_assist_open"

const getPageCoach = (pathname: string): PageCoach => {
  if (pathname.startsWith("/dashboard/crm")) {
    return {
      title: "CRM Coach",
      hint: "Track contacts, deal stages, and follow-ups.",
      prompts: ["How many contacts do we have?", "Show open deals", "Generate follow-up tasks"],
    }
  }

  if (pathname.startsWith("/dashboard/accounting")) {
    return {
      title: "Accounting Coach",
      hint: "Review invoices, expenses, and report readiness.",
      prompts: ["Show finance snapshot", "How many overdue invoices do we have?", "Draft invoice reminder email"],
    }
  }

  if (pathname.startsWith("/dashboard/hr")) {
    return {
      title: "HR Coach",
      hint: "Manage employees, attendance, leave, and payroll actions.",
      prompts: ["How many employees do we have?", "Guide me on attendance flow", "Take me to payroll controls"],
    }
  }

  if (pathname.startsWith("/dashboard/operations")) {
    return {
      title: "Ops Coach",
      hint: "Run workflows, playbooks, webhooks, and command actions.",
      prompts: ["Show live counts", "What should I fix first in Ops?", "Take me to playbooks"],
    }
  }

  if (pathname.startsWith("/dashboard/portal")) {
    return {
      title: "Portal Coach",
      hint: "Publish client updates and manage shared documents.",
      prompts: ["How many active portals do we have?", "Help me post a status update", "Take me to documents"],
    }
  }

  return {
    title: "Civis Coach",
    hint: "Ask anything about this page, and I will guide you step by step.",
    prompts: ["What can I do on this page?", "Show my business snapshot", "Take me to CRM"],
  }
}

const flashHighlight = (selector?: string) => {
  if (!selector || typeof window === "undefined") return
  const element = document.querySelector(selector) as HTMLElement | null
  if (!element) return
  const previous = element.style.boxShadow
  const previousTransition = element.style.transition
  element.style.transition = "box-shadow 0.2s ease"
  element.style.boxShadow = "0 0 0 3px #4C8BFF, 0 0 0 8px rgba(76, 139, 255, 0.22)"
  element.scrollIntoView({ behavior: "smooth", block: "center" })
  window.setTimeout(() => {
    element.style.boxShadow = previous
    element.style.transition = previousTransition
  }, 3500)
}

export function AiAssistPopover() {
  const pathname = usePathname()
  const router = useRouter()
  const [instruction, setInstruction] = useState<AiAssistInstruction | null>(null)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const pageCoach = useMemo(() => getPageCoach(pathname), [pathname])

  const onTargetPage = useMemo(() => {
    if (!instruction?.route) return false
    return pathname === instruction.route || pathname.startsWith(`${instruction.route}/`)
  }, [instruction?.route, pathname])

  useEffect(() => {
    const refresh = () => setInstruction(readAiAssistInstruction())
    refresh()
    window.addEventListener(AI_ASSIST_EVENT, refresh)
    window.addEventListener("storage", refresh)
    return () => {
      window.removeEventListener(AI_ASSIST_EVENT, refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const rawOpen = localStorage.getItem(OPEN_STORAGE_KEY)
    if (rawOpen === "true") setOpen(true)
    const rawMessages = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!rawMessages) return
    try {
      const parsed = JSON.parse(rawMessages)
      if (Array.isArray(parsed)) setMessages(parsed)
    } catch {
      // ignore local parse errors
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(OPEN_STORAGE_KEY, open ? "true" : "false")
  }, [open])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    if (!instruction) return
    setOpen(true)
  }, [instruction])

  useEffect(() => {
    if (!instruction || !onTargetPage) return
    const timer = window.setTimeout(() => flashHighlight(instruction.selector), 250)
    return () => window.clearTimeout(timer)
  }, [instruction, onTargetPage])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)
    setError("")

    const headers: Record<string, string> = { "Content-Type": "application/json", ...getSessionHeaders() }
    headers["x-current-path"] = pathname
    if (typeof window !== "undefined") {
      headers["x-hr-sensitive-unlocked"] = localStorage.getItem("civis_payroll_unlocked") === "true" ? "true" : "false"
      headers["x-finance-sensitive-unlocked"] =
        localStorage.getItem("civis_finance_unlocked") === "true" ? "true" : "false"
    }

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          mode: "qna",
          messages: nextMessages,
          context: {
            currentPath: pathname,
            pageTitle: pageCoach.title,
            pageHint: pageCoach.hint,
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Civis AI is unavailable right now.")

      const reply = typeof data?.message === "string" && data.message.trim() ? data.message : "I’m ready."
      setMessages([...nextMessages, { role: "assistant", content: reply }])

      const actions = Array.isArray(data?.actions) ? (data.actions as AiAssistInstruction[]) : []
      const navigateAction = actions.find((item) => item?.type === "navigate" && item.route)
      if (navigateAction) {
        writeAiAssistInstruction(navigateAction)
        if (pathname === navigateAction.route || pathname.startsWith(`${navigateAction.route}/`)) {
          flashHighlight(navigateAction.selector)
        } else {
          router.push(navigateAction.route)
        }
      }
    } catch (err: any) {
      const fallback = err?.message || "I ran into an error. Try again in a moment."
      setError(fallback)
      setMessages([...nextMessages, { role: "assistant", content: fallback }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-[70]">
        <Button className="rounded-full h-12 px-4 shadow-lg gap-2" onClick={() => setOpen(true)}>
          <Bot className="w-4 h-4" />
          AI Guide
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-[70] w-[min(420px,94vw)] rounded-xl border border-border bg-card p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {pageCoach.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{pageCoach.hint}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {instruction && (
        <div className="mb-3 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-medium flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-primary" />
            {instruction.title || "AI Navigation Assistant"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {instruction.message || "I can guide you and highlight where to work next."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {!onTargetPage ? (
              <Button
                size="sm"
                onClick={() => {
                  router.push(instruction.route)
                }}
              >
                Take me there
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="bg-transparent"
                onClick={() => flashHighlight(instruction.selector)}
              >
                Highlight again
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearAiAssistInstruction}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-background p-3 max-h-72 overflow-auto space-y-2">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {pageCoach.prompts.map((prompt) => (
                <Button key={prompt} size="sm" variant="secondary" className="bg-muted" onClick={() => sendMessage(prompt)}>
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`rounded-md px-3 py-2 text-xs ${
                message.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted text-foreground"
              }`}
            >
              <p className="font-medium mb-1">{message.role === "user" ? "You" : "Civis AI"}</p>
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          ))
        )}
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this page..."
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              sendMessage(input)
            }
          }}
        />
        <Button onClick={() => sendMessage(input)} disabled={loading}>
          {loading ? "..." : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  )
}
