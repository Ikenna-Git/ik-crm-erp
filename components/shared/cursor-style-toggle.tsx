"use client"

import { useEffect, useState } from "react"
import { MousePointer2 } from "lucide-react"

import { CIVIS_CURSOR_EVENT, CIVIS_CURSOR_STORAGE_KEY, type CursorStyle } from "@/components/shared/civis-cursor"
import { Button } from "@/components/ui/button"

const options: Array<{ value: CursorStyle; label: string }> = [
  { value: "system", label: "System cursor" },
  { value: "command", label: "Civis command ring" },
  { value: "precision", label: "Precision ring" },
]

export function CursorStyleToggle() {
  const [value, setValue] = useState<CursorStyle>("command")
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(CIVIS_CURSOR_STORAGE_KEY)
    if (raw === "system" || raw === "command" || raw === "precision") setValue(raw)

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const fine = window.matchMedia("(pointer: fine)")
    const syncCapability = () => setEnabled(fine.matches && !reduced.matches)
    syncCapability()
    reduced.addEventListener("change", syncCapability)
    fine.addEventListener("change", syncCapability)
    return () => {
      reduced.removeEventListener("change", syncCapability)
      fine.removeEventListener("change", syncCapability)
    }
  }, [])

  const onChange = (next: CursorStyle) => {
    setValue(next)
    if (typeof window === "undefined") return
    window.localStorage.setItem(CIVIS_CURSOR_STORAGE_KEY, next)
    window.dispatchEvent(new CustomEvent(CIVIS_CURSOR_EVENT))
  }

  return (
    <div className="rounded-[24px] border border-border/80 bg-card/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MousePointer2 className="h-4 w-4 text-primary" />
            Experience cursor
          </p>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Optional on desktop pointer devices only. Inputs and text fields keep the normal system cursor.
          </p>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {enabled ? "Desktop ready" : "System only"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
