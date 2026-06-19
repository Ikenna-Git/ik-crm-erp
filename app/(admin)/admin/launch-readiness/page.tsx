"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck, Wrench } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type LaunchItem = {
  id: string
  label: string
  status: string
  reason: string
  nextAction: string
  evidenceNote?: string
  href?: string
}

type LaunchReadinessResponse = {
  securityAndAccess: LaunchItem[]
  providerDiagnostics: Array<LaunchItem & { feature: string }>
  productModules: LaunchItem[]
  launchEvidence: LaunchItem[]
  meta: {
    inviteCount: number
    dbLatencyMs?: number
    largestWorkspace: { name: string; users: number } | null
  }
}

const badgeTone: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  configured: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  limited: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  partial: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  "preview-only": "bg-sky-500/15 text-sky-300 hover:bg-sky-500/15",
  blocked: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  missing: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  "action-required": "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  disabled: "bg-slate-500/15 text-slate-300 hover:bg-slate-500/15",
  test: "bg-violet-500/15 text-violet-300 hover:bg-violet-500/15",
  optional: "bg-slate-500/15 text-slate-300 hover:bg-slate-500/15",
}

const titleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

function Section({
  title,
  description,
  items,
  renderMeta,
}: {
  title: string
  description: string
  items: LaunchItem[]
  renderMeta?: (item: LaunchItem) => ReactNode
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-slate-100">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-slate-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                {renderMeta ? renderMeta(item) : null}
              </div>
              <Badge className={badgeTone[item.status] || badgeTone.limited}>{titleCase(item.status)}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-300">{item.reason}</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
              <p className="font-medium text-white">Next action</p>
              <p className="mt-1">{item.nextAction}</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>{item.evidenceNote || "Evidence pending."}</span>
              {item.href ? (
                <Link href={item.href} className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function AdminLaunchReadinessPage() {
  const [data, setData] = useState<LaunchReadinessResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/admin/launch-readiness")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load launch readiness")
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load launch readiness")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const counts = useMemo(() => {
    if (!data) return { ready: 0, limited: 0, action: 0 }
    const all = [...data.securityAndAccess, ...data.providerDiagnostics, ...data.productModules, ...data.launchEvidence]
    return {
      ready: all.filter((item) => item.status === "ready" || item.status === "configured").length,
      limited: all.filter((item) => item.status === "limited" || item.status === "partial" || item.status === "preview-only" || item.status === "test").length,
      action: all.filter((item) => item.status === "action-required" || item.status === "missing" || item.status === "blocked").length,
    }
  }, [data])

  if (loading) {
    return <p className="text-sm text-slate-300">Loading launch readiness...</p>
  }

  if (!data) {
    return <p className="text-sm text-rose-300">{error || "Launch readiness is unavailable."}</p>
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-white/5 text-slate-100">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Founder launch readiness</Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Evidence-driven
              </Badge>
            </div>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">Know what is ready, what is limited, and what still blocks launch.</h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              This page is the founder release board for Civis. It stays honest: configured providers are not treated as proven,
              preview-only features stay preview-only, and missing evidence stays action required.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Verified / configured
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{counts.ready}</p>
              <p className="mt-2 text-sm text-slate-300">Signals currently marked ready or configured.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-amber-300" />
                Limited / pending
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{counts.limited}</p>
              <p className="mt-2 text-sm text-slate-300">Features that exist but still need live evidence or provider validation.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <AlertTriangle className="h-4 w-4 text-rose-300" />
                Action required
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{counts.action}</p>
              <p className="mt-2 text-sm text-slate-300">Items still blocking credible launch approval.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Invite queue
              </div>
              <p className="mt-3 text-4xl font-semibold text-white">{data.meta.inviteCount}</p>
              <p className="mt-2 text-sm text-slate-300">Active invite link{data.meta.inviteCount === 1 ? "" : "s"} currently live.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Wrench className="h-4 w-4 text-violet-300" />
                Largest workspace
              </div>
              <p className="mt-3 text-lg font-semibold text-white">
                {data.meta.largestWorkspace ? data.meta.largestWorkspace.name : "No workspace data"}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {data.meta.largestWorkspace ? `${data.meta.largestWorkspace.users} users` : "Action required for live usage evidence."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardContent className="grid gap-3 p-6 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Ready</p>
            <p className="mt-1">Working and already backed by code or live evidence.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Limited</p>
            <p className="mt-1">Feature exists, but live evidence or provider validation is still pending.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Action Required</p>
            <p className="mt-1">Manual validation, evidence, or sign-off is still needed before launch approval.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Missing</p>
            <p className="mt-1">Required provider or configuration is absent, so the capability cannot be claimed as live.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-sm text-slate-300">
            <p className="font-medium text-white">Preview Only</p>
            <p className="mt-1">Intentionally non-production in this release. No fake live success should be implied.</p>
          </div>
        </CardContent>
      </Card>

      <Section
        title="Security and Access"
        description="These are the non-negotiable guardrails for launch."
        items={data.securityAndAccess}
      />

      <Section
        title="Environment Providers"
        description="Configured means present, not proven. Missing or partial stays visible."
        items={data.providerDiagnostics}
        renderMeta={(item) => {
          const feature = "feature" in item && typeof item.feature === "string" ? item.feature : null
          return feature ? <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{feature}</p> : null
        }}
      />

      <Section
        title="Product Modules"
        description="Each module stays honest about whether it is ready, limited, preview-only, or blocked."
        items={data.productModules}
      />

      <Section
        title="Launch Evidence"
        description="Do not approve launch based on assumptions. Missing evidence stays action required."
        items={data.launchEvidence}
      />
    </div>
  )
}
