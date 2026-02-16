"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2, Clock, Sparkles } from "lucide-react"

export type FollowupItem = {
  id: string
  label: string
  meta?: string
  daysIdle?: number
  priority?: "critical" | "high" | "normal"
}

export type FollowupGroup = {
  count: number
  items: FollowupItem[]
}

export type FollowupSummary = {
  inactiveContacts: FollowupGroup
  stalledDeals: FollowupGroup
  generatedAt?: string
}

type FollowupSchedulerCardProps = {
  summary: FollowupSummary | null
  loading?: boolean
  notice?: string
  onGenerate: () => void
}

const priorityWeight = {
  critical: 3,
  high: 2,
  normal: 1,
} as const

const normalizePriority = (priority?: string) => {
  if (priority === "critical" || priority === "high" || priority === "normal") return priority
  return "normal"
}

const sortItems = (items: FollowupItem[]) =>
  [...items].sort((a, b) => {
    const aPriority = normalizePriority(a.priority)
    const bPriority = normalizePriority(b.priority)
    const priorityDelta = priorityWeight[bPriority] - priorityWeight[aPriority]
    if (priorityDelta !== 0) return priorityDelta
    const aIdle = a.daysIdle ?? 0
    const bIdle = b.daysIdle ?? 0
    return bIdle - aIdle
  })

const priorityBadgeClass = (priority: "critical" | "high" | "normal") => {
  if (priority === "critical") return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300"
  if (priority === "high") return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
  return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
}

export function FollowupSchedulerCard({ summary, loading, notice, onGenerate }: FollowupSchedulerCardProps) {
  const inactiveCount = summary?.inactiveContacts.count || 0
  const stalledCount = summary?.stalledDeals.count || 0
  const total = inactiveCount + stalledCount
  const topInactive = sortItems(summary?.inactiveContacts.items || []).slice(0, 3)
  const topStalled = sortItems(summary?.stalledDeals.items || []).slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Follow-up Scheduler
          </CardTitle>
          <CardDescription>Auto-create tasks when contacts go cold or deals stall.</CardDescription>
        </div>
        <Button size="sm" onClick={onGenerate} disabled={loading}>
          {loading ? "Generating..." : "Generate follow-ups"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Inactive contacts {inactiveCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Stalled deals {stalledCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Suggested tasks {total}
          </Badge>
        </div>

        {notice ? <p className="text-xs text-muted-foreground">{notice}</p> : null}

        {summary && total > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="h-4 w-4 text-primary" />
                Inactive contacts (highest priority first)
              </div>
              <div className="space-y-2 text-sm">
                {topInactive.map((item) => {
                  const priority = normalizePriority(item.priority)
                  return (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase ${priorityBadgeClass(priority)}`}>
                      {priority}
                    </Badge>
                  </div>
                  )
                })}
                {summary.inactiveContacts.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{summary.inactiveContacts.items.length - 3} more contacts
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="h-4 w-4 text-primary" />
                Stalled deals (highest priority first)
              </div>
              <div className="space-y-2 text-sm">
                {topStalled.map((item) => {
                  const priority = normalizePriority(item.priority)
                  return (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] uppercase ${priorityBadgeClass(priority)}`}>
                      {priority}
                    </Badge>
                  </div>
                  )
                })}
                {summary.stalledDeals.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{summary.stalledDeals.items.length - 3} more deals
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>Everything is on track. No follow-ups needed.</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
