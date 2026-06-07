"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

type PremiumEmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  icon?: ReactNode
  primaryAction?: ReactNode
  secondaryAction?: ReactNode
}

export function PremiumEmptyState({
  eyebrow,
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
}: PremiumEmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-gradient-to-br from-background via-background to-muted/30 px-6 py-10 text-center">
      {icon ? <div className="mb-4 rounded-2xl border border-border bg-card p-3 text-primary shadow-sm">{icon}</div> : null}
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{eyebrow}</p> : null}
      <h3 className="mt-3 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
