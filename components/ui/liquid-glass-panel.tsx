"use client"

import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type LiquidGlassPanelProps = HTMLAttributes<HTMLDivElement> & {
  insetGlow?: boolean
}

export function LiquidGlassPanel({
  className,
  insetGlow = false,
  children,
  ...props
}: LiquidGlassPanelProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/12 bg-white/6 backdrop-blur-xl",
        "shadow-[0_18px_60px_-26px_rgba(15,23,42,0.65)]",
        "supports-[backdrop-filter]:bg-white/8 dark:border-white/10 dark:bg-white/[0.045]",
        insetGlow && "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/10 before:opacity-70",
        "relative overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.12),transparent_42%,transparent_58%,rgba(59,130,246,0.06))]" />
      {children}
    </div>
  )
}
