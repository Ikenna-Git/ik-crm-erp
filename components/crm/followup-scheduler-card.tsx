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

export function FollowupSchedulerCard({ summary, loading, notice, onGenerate }: FollowupSchedulerCardProps) {
  const inactiveCount = summary?.inactiveContacts.count || 0
  const stalledCount = summary?.stalledDeals.count || 0
  const total = inactiveCount + stalledCount

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
                Inactive contacts
              </div>
              <div className="space-y-2 text-sm">
                {summary.inactiveContacts.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.meta}</span>
                  </div>
                ))}
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
                Stalled deals
              </div>
              <div className="space-y-2 text-sm">
                {summary.stalledDeals.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.meta}</span>
                  </div>
                ))}
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
