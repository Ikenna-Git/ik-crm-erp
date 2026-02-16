"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Navigation, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AI_ASSIST_EVENT,
  clearAiAssistInstruction,
  readAiAssistInstruction,
  type AiAssistInstruction,
} from "@/lib/ai-assist"

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
    if (!instruction || !onTargetPage) return
    const timer = window.setTimeout(() => flashHighlight(instruction.selector), 250)
    return () => window.clearTimeout(timer)
  }, [instruction, onTargetPage])

  if (!instruction) return null

  return (
    <div className="fixed bottom-6 right-6 z-[70] w-[min(360px,92vw)] rounded-xl border border-border bg-card p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            <Navigation className="w-4 h-4 text-primary" />
            {instruction.title || "AI Navigation Assistant"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {instruction.message || "I can guide you and highlight where to work next."}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearAiAssistInstruction}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
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
  )
}
