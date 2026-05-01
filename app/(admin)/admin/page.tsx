"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  FolderKanban,
  MailWarning,
  ReceiptText,
  ShieldAlert,
  Users,
  Workflow,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type OverviewResponse = {
  actor: {
    name?: string | null
    email?: string | null
    role?: string | null
    founderEmail: string
  }
  workspace: {
    org: {
      id: string
      name: string
      notifyEmail?: string | null
      theme?: string | null
      createdAt: string
    }
    summary: {
      userCount: number
      adminCount: number
      twoFactorCount: number
      twoFactorCoverage: number
      contactCount: number
      employeeCount: number
      workflowCount: number
      activePortalCount: number
      overdueInvoiceCount: number
      pendingExpenseCount: number
      activeProjectCount: number
    }
    recentAuditEvents: Array<{
      id: string
      action: string
      entity?: string | null
      createdAt: string
    }>
  }
  opsCenter: {
    healthScore: number
    issueCount: number
    criticalCount: number
    warningCount: number
    infoCount: number
    issues: Array<{
      id: string
      severity: "critical" | "warning" | "info"
      title: string
      detail: string
      metric: string
      href: string
      cta: string
    }>
    healthChecks: Array<{
      id: string
      label: string
      status: "healthy" | "warning" | "critical"
      detail: string
    }>
    incidents: Array<{
      id: string
      message: string
      href?: string | null
      source?: string | null
      createdAt: string
    }>
    nextActions: Array<{
      id: string
      title: string
      detail: string
      href: string
      cta: string
    }>
  }
  platform:
    | {
        totalOrgs: number
        totalUsers: number
        recentOrgs: Array<{
          id: string
          name: string
          notifyEmail?: string | null
          _count: { users: number; contacts: number; deals: number; invoices: number }
        }>
      }
    | null
}

const quickStats = [
  { key: "userCount", label: "People in workspace", icon: Users },
  { key: "workflowCount", label: "Active workflows", icon: Workflow },
  { key: "activeProjectCount", label: "Projects in motion", icon: FolderKanban },
  { key: "activePortalCount", label: "Live client portals", icon: Bot },
] as const

const issueIcons = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: MailWarning,
} as const

const issueBadgeClasses = {
  critical: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  warning: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  info: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/15",
} as const

const checkBadgeClasses = {
  healthy: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  warning: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  critical: "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
} as const

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "n/a"

export default function AdminOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/admin/overview")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load admin overview")
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin overview")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-300">Loading admin ops center...</p>
  }

  if (!data) {
    return <p className="text-sm text-rose-300">{error || "Admin ops center unavailable."}</p>
  }

  const { actor, workspace, opsCenter, platform } = data

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-white/5 text-slate-100">
        <CardContent className="grid gap-6 p-0 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 p-6 lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Admin ops center</Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Founder lock: {actor.founderEmail}
              </Badge>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white md:text-4xl">Run Civis like a platform, not a pile of pages.</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                This is your control room for access, issues, workspace health, and what needs attention next. Keep
                stakeholder admins inside their own lane while you stay above the whole system.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {quickStats.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.key} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.label}</span>
                      <Icon className="h-4 w-4 text-emerald-300" />
                    </div>
                    <p className="text-3xl font-semibold">{workspace.summary[item.key]}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-white/10 bg-slate-950/45 p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Workspace health score</p>
                  <p className="mt-2 text-5xl font-semibold text-white">{opsCenter.healthScore}</p>
                </div>
                <Badge className={opsCenter.criticalCount > 0 ? issueBadgeClasses.critical : issueBadgeClasses.warning}>
                  {opsCenter.issueCount} open issue{opsCenter.issueCount === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-primary transition-all"
                  style={{ width: `${opsCenter.healthScore}%` }}
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Critical</p>
                  <p className="mt-2 text-2xl font-semibold">{opsCenter.criticalCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Warnings</p>
                  <p className="mt-2 text-2xl font-semibold">{opsCenter.warningCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">2FA coverage</p>
                  <p className="mt-2 text-2xl font-semibold">{workspace.summary.twoFactorCoverage}%</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Admin reading for today</p>
                <p className="mt-2">
                  {opsCenter.issueCount > 0
                    ? "You now have a clean shortlist of what to fix first, not a vague admin page."
                    : "The workspace is quiet right now. Use this space to verify access, settings, and stakeholder readiness."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>What needs attention right now</CardTitle>
            <CardDescription className="text-slate-400">
              Actual queues, risks, and operational gaps your admins should work through first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opsCenter.issues.length ? (
              opsCenter.issues.map((issue) => {
                const Icon = issueIcons[issue.severity]
                return (
                  <div key={issue.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-2xl bg-white/5 p-2">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white">{issue.title}</p>
                            <Badge className={issueBadgeClasses[issue.severity]}>{issue.severity}</Badge>
                          </div>
                          <p className="text-sm text-slate-300">{issue.detail}</p>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{issue.metric}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-white/10 bg-transparent text-slate-100" asChild>
                        <Link href={issue.href}>
                          {issue.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-5 text-sm text-emerald-200">
                Nothing urgent is open. Use this window to improve security coverage, data quality, and stakeholder setup
                before the next rollout wave.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>System checks</CardTitle>
            <CardDescription className="text-slate-400">
              Quick confidence signals for the parts normal admins never want to guess about.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opsCenter.healthChecks.map((check) => (
              <div key={check.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{check.label}</p>
                  <Badge className={checkBadgeClasses[check.status]}>{check.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{check.detail}</p>
              </div>
            ))}

            <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="font-medium text-white">Recent live incidents</p>
                <Badge className={opsCenter.incidents.length ? issueBadgeClasses.warning : checkBadgeClasses.healthy}>
                  {opsCenter.incidents.length} captured
                </Badge>
              </div>
              {opsCenter.incidents.length ? (
                <div className="space-y-3">
                  {opsCenter.incidents.map((incident) => (
                    <div key={incident.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-medium text-white">{incident.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{incident.source || "client runtime"} • {formatDateTime(incident.createdAt)}</p>
                      {incident.href ? <p className="mt-1 truncate text-xs text-slate-500">{incident.href}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-300">No recent browser/runtime incidents have been reported.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>What your admins should do next</CardTitle>
            <CardDescription className="text-slate-400">
              Plain-language actions so the control plane feels guided, not overwhelming.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {opsCenter.nextActions.map((action) => (
              <div key={action.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <p className="font-medium text-white">{action.title}</p>
                <p className="mt-2 text-sm text-slate-300">{action.detail}</p>
                <Button className="mt-4" variant="secondary" asChild>
                  <Link href={action.href}>
                    {action.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>Recent admin activity</CardTitle>
            <CardDescription className="text-slate-400">
              A simple audit feed so you can see who touched what without digging through logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">Action</TableHead>
                  <TableHead className="text-slate-300">Entity</TableHead>
                  <TableHead className="text-slate-300">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.recentAuditEvents.length ? (
                  workspace.recentAuditEvents.map((event) => (
                    <TableRow key={event.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>{event.action}</TableCell>
                      <TableCell>{event.entity || "System"}</TableCell>
                      <TableCell>{formatDateTime(event.createdAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableCell colSpan={3} className="text-slate-400">
                      No admin events yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {platform ? (
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Founder watchlist</CardTitle>
                <CardDescription className="text-slate-400">
                  Your cross-workspace view for stakeholder growth, usage, and support intervention.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                {platform.totalOrgs} workspaces / {platform.totalUsers} users
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {platform.recentOrgs.map((workspaceItem) => (
              <div key={workspaceItem.id} className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{workspaceItem.name}</p>
                      <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-300">
                        {workspaceItem._count.users} users
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{workspaceItem.notifyEmail || "No notify inbox configured yet."}</p>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-slate-300">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Contacts</p>
                        <p className="mt-2 text-lg font-semibold">{workspaceItem._count.contacts}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Deals</p>
                        <p className="mt-2 text-lg font-semibold">{workspaceItem._count.deals}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Invoices</p>
                        <p className="mt-2 text-lg font-semibold">{workspaceItem._count.invoices}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">People and access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>{workspace.summary.userCount} people currently share this workspace.</p>
            <p>{workspace.summary.adminCount} of them can make admin decisions.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Finance queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between">
              <span>Overdue invoices</span>
              <ReceiptText className="h-4 w-4 text-emerald-300" />
            </div>
            <p className="text-3xl font-semibold text-white">{workspace.summary.overdueInvoiceCount}</p>
            <p>{workspace.summary.pendingExpenseCount} pending expenses are also waiting for review.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Client communication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p>{workspace.summary.activePortalCount} client portal links are active.</p>
            <p>{workspace.summary.contactCount} CRM contact records are currently in the system.</p>
            <Button variant="outline" className="border-white/10 bg-transparent text-slate-100" asChild>
              <Link href="/dashboard/portal">
                Open portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
