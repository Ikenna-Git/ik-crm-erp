"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ExternalLink, LockKeyhole, Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SetupItem = {
  id: string
  label: string
  status: string
  reason: string
  nextAction: string
  href?: string
}

type SetupReadinessResponse = {
  workspace: {
    id: string
    name: string
    role: string
  }
  setupItems: SetupItem[]
}

const badgeTone: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  limited: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  "action-required": "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  blocked: "bg-slate-500/15 text-slate-300 hover:bg-slate-500/15",
  optional: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/15",
}

const titleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export default function SetupPage() {
  const [data, setData] = useState<SetupReadinessResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/setup/readiness")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load setup readiness")
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load setup readiness")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const progress = useMemo(() => {
    if (!data?.setupItems?.length) return 0
    const done = data.setupItems.filter((item) => item.status === "ready").length
    return Math.round((done / data.setupItems.length) * 100)
  }, [data])

  if (loading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading setup center...</p>
  }

  if (!data) {
    return <p className="p-6 text-sm text-destructive">{error || "Setup center unavailable."}</p>
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/25">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Workspace setup center</Badge>
              <Badge variant="outline">{data.workspace.role}</Badge>
            </div>
            <h1 className="text-3xl font-semibold">Set up {data.workspace.name} without guessing what is actually done.</h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              Civis only marks a setup item done when the app can observe a real signal. Everything else stays action
              required, blocked, optional, or limited until it can be validated honestly.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard/crm">
                  Seed CRM
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/ai">Ask Civis Guide what to do next</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Verified setup
              </div>
              <p className="mt-3 text-4xl font-semibold">
                {data.setupItems.filter((item) => item.status === "ready").length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Items the app can confirm as done.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <LockKeyhole className="h-4 w-4 text-amber-500" />
                Setup progress
              </div>
              <p className="mt-3 text-4xl font-semibold">{progress}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Measured from verifiable setup signals only.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4 sm:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Rocket className="h-4 w-4 text-primary" />
                Launch note
              </div>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                Provider-backed items may still require founder deployment access. That is why they stay blocked or
                action required here instead of pretending the workspace admin can finish them alone.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>First-run checklist</CardTitle>
          <CardDescription>Each item links to the real place to validate it.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {data.setupItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                </div>
                <Badge className={badgeTone[item.status] || badgeTone.limited}>{titleCase(item.status)}</Badge>
              </div>
              <div className="mt-4 rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="font-medium">Next action</p>
                <p className="mt-1 text-muted-foreground">{item.nextAction}</p>
              </div>
              {item.href ? (
                <Button asChild variant="link" className="mt-3 h-auto p-0">
                  <Link href={item.href}>
                    Open
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
