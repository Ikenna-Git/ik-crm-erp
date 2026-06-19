"use client"

import { useEffect, useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, DollarSign, Package, AlertTriangle, ArrowUpRight, SlidersHorizontal, ShieldCheck, Wrench, Rocket } from "lucide-react"
import { formatNaira } from "@/lib/currency"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { getSessionHeaders } from "@/lib/user-settings"
import { KPI_CATALOG, getDefaultKpis } from "@/lib/kpis"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useSession } from "next-auth/react"
import { PremiumEmptyState } from "@/components/shared/premium-empty-state"
import { canViewFounderControls } from "@/lib/authz"

const emptyCommand = {
  stats: {
    contacts: 0,
    openDeals: 0,
    pipelineValue: 0,
    revenueMtd: 0,
    expensesMtd: 0,
    overdueInvoices: 0,
    pendingExpenses: 0,
  },
  decisions: [],
  recentActivity: [],
}

const impactStyles = {
  High: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  Low: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
}

const activityStatusStyles = {
  success: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
}

const kpiIcons: Record<string, any> = {
  contacts: Users,
  openDeals: TrendingUp,
  pipelineValue: DollarSign,
  revenueMtd: DollarSign,
  expensesMtd: Package,
  overdueInvoices: AlertTriangle,
  pendingExpenses: Package,
}

type DecisionItem = {
  id: string
  title: string
  detail: string
  impact: keyof typeof impactStyles
  action: string
  href: string
}

type RecentActivityItem = {
  id: string
  title: string
  detail: string
  time: string
  status: keyof typeof activityStatusStyles
}

type SetupItem = {
  id: string
  label: string
  status: string
  reason: string
  nextAction: string
  href?: string
}

type SetupReadinessResponse = {
  setupItems: SetupItem[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [kpiLayout, setKpiLayout] = useState<string[]>([])
  const [kpiDraft, setKpiDraft] = useState<string[]>([])
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false)
  const [kpiError, setKpiError] = useState("")
  const [kpiSaving, setKpiSaving] = useState(false)
  const [setupReadiness, setSetupReadiness] = useState<SetupReadinessResponse | null>(null)
  const [setupError, setSetupError] = useState("")

  const commandState = useCachedFetch(
    "civis_dashboard_command_live",
    async () => {
      const res = await fetch("/api/ops/command", { headers: { ...getSessionHeaders() } })
      if (res.status === 503) return emptyCommand
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load dashboard insights")
      return data
    },
    1000 * 60 * 5,
  )

  const commandData = commandState.data || emptyCommand
  const commandHasSignal =
    commandData?.stats &&
    Object.values(commandData.stats).some((value) => typeof value === "number" && value > 0)
  const command = commandHasSignal ? commandData : emptyCommand
  const performanceData = commandHasSignal
    ? [{ month: "MTD", revenue: command.stats.revenueMtd, expenses: command.stats.expensesMtd }]
    : []
  const operationalMix = [
    { name: "Open Deals", value: Number(command.stats.openDeals || 0), fill: "#48b0f7" },
    { name: "Overdue Invoices", value: Number(command.stats.overdueInvoices || 0), fill: "#0f766e" },
    { name: "Pending Expenses", value: Number(command.stats.pendingExpenses || 0), fill: "#2d7c8a" },
  ].filter((item) => item.value > 0)

  useEffect(() => {
    const loadKpis = async () => {
      try {
        const res = await fetch("/api/user/settings", { headers: { ...getSessionHeaders() } })
        if (res.status === 503) {
          const defaults = getDefaultKpis(role)
          setKpiLayout(defaults)
          setKpiDraft(defaults)
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load settings")
        const incoming = Array.isArray(data.kpis) && data.kpis.length ? data.kpis : getDefaultKpis(role)
        setKpiLayout(incoming)
        setKpiDraft(incoming)
      } catch (err: any) {
        setKpiError(err?.message || "Failed to load KPI settings")
        const defaults = getDefaultKpis(role)
        setKpiLayout(defaults)
        setKpiDraft(defaults)
      }
    }
    loadKpis()
  }, [role])

  useEffect(() => {
    const loadSetup = async () => {
      try {
        setSetupError("")
        const res = await fetch("/api/setup/readiness", { headers: { ...getSessionHeaders() } })
        if (res.status === 503) {
          setSetupReadiness({ setupItems: [] })
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load setup readiness")
        setSetupReadiness(data)
      } catch (err: any) {
        setSetupError(err?.message || "Failed to load setup readiness")
        setSetupReadiness({ setupItems: [] })
      }
    }

    loadSetup()
  }, [])

  useEffect(() => {
    if (kpiDialogOpen) {
      setKpiDraft(kpiLayout.length ? kpiLayout : getDefaultKpis(role))
    }
  }, [kpiDialogOpen, kpiLayout, role])

  const activeKpis = useMemo(() => {
    const ids = kpiLayout.length ? kpiLayout : getDefaultKpis(role)
    return KPI_CATALOG.filter((kpi) => ids.includes(kpi.id))
  }, [kpiLayout, role])

  const kpiCards = activeKpis.map((kpi) => {
    const value = command.stats?.[kpi.key] ?? 0
    const display =
      kpi.format === "naira" ? formatNaira(Number(value)) : kpi.format === "percent" ? `${value}%` : value
    return { ...kpi, value: display }
  })

  const decisionFeed: DecisionItem[] = Array.isArray(command.decisions) ? (command.decisions as DecisionItem[]) : []
  const recentActivity: RecentActivityItem[] = Array.isArray(command.recentActivity)
    ? (command.recentActivity as RecentActivityItem[])
    : []

  const toggleKpi = (id: string) => {
    setKpiDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const verifiedSetupCount = setupReadiness?.setupItems?.filter((item) => item.status === "ready").length || 0
  const setupActionCount =
    setupReadiness?.setupItems?.filter((item) => item.status === "action-required" || item.status === "blocked").length || 0
  const isFounderView = canViewFounderControls(session?.user?.role, session?.user?.email)
  const todayPriorities = decisionFeed.slice(0, 3)
  const setupBlockers = [
    ...(commandState.error
      ? [
          {
            title: "Ops command feed needs attention",
            detail: commandState.error,
            href: "/dashboard/operations",
            cta: "Open Operations",
          },
        ]
      : []),
    ...(!commandHasSignal
      ? [
          {
            title: "Workspace still needs real operating data",
            detail: "Add contacts, deals, invoices, expenses, and tasks so Civis Pulse can rank live priorities.",
            href: "/dashboard/crm",
            cta: "Start in CRM",
          },
        ]
      : []),
    {
      title: "Provider-backed flows still need validation",
      detail: "SMTP, Cloudinary, Stripe, and rate limits should stay in setup-required mode until evidence is recorded.",
      href: "/pricing",
      cta: "Review launch scope",
    },
    {
      title: "Backup, restore, and fake-data evidence still require sign-off",
      detail: isFounderView
        ? "Founder checks still need backup, restore drill, and fake-data review evidence."
        : "Ask the founder/admin to finish backup, restore drill, and fake-data review evidence before launch sign-off.",
      href: isFounderView ? "/admin/system" : "/dashboard/settings",
      cta: isFounderView ? "Open Founder Desk" : "Open Settings",
    },
  ].slice(0, 3)
  const suggestedNextActions = commandHasSignal
    ? [
        {
          title: "Work the highest-risk item first",
          detail: todayPriorities[0]?.detail || "Start with whichever queue is red, overdue, or blocked today.",
          href: todayPriorities[0]?.href || "/dashboard/operations",
          cta: todayPriorities[0]?.action || "Open queue",
        },
        {
          title: "Confirm one end-to-end flow after every deploy",
          detail: "Use approvals, CRM updates, or invite flow as proof that the system persists real state after refresh.",
          href: "/dashboard/operations",
          cta: "Check approvals",
        },
        {
          title: "Use Civis AI for deterministic navigation",
          detail: "Try 'take me to pricing', 'open gallery', or 'what should I do next?' to validate the Civis Guide command layer.",
          href: "/dashboard/ai",
          cta: "Open Civis Guide",
        },
      ]
    : [
        {
          title: "Seed CRM first",
          detail: "One contact, one company, and one deal make the dashboard much more useful immediately.",
          href: "/dashboard/crm",
          cta: "Open CRM",
        },
        {
          title: "Record one invoice and one expense",
          detail: "That gives Accounting and Operations a trustworthy starting point before you trust the summaries.",
          href: "/dashboard/accounting",
          cta: "Open Accounting",
        },
        {
          title: "Invite one operator safely",
          detail: "Use Settings or Admin to validate org-scoped onboarding without touching founder controls.",
          href: "/dashboard/settings",
          cta: "Open Settings",
        },
      ]
  const launchSetupPath = [
    {
      title: "Configure core providers",
      detail: "SMTP, Cloudinary, Upstash, and billing should be marked live only after validation evidence exists.",
      href: "/dashboard/setup",
      cta: "Open setup center",
    },
    {
      title: "Validate role and privacy boundaries",
      detail: "Invite a teammate, confirm org scoping, and unlock HR or Accounting privacy only if the role allows it.",
      href: "/admin",
      cta: "Review admin access",
    },
    {
      title: "Run one end-to-end workflow",
      detail: "Create a contact, invoice, approval, and portal update so Civis Pulse reflects real operating state.",
      href: "/dashboard/operations",
      cta: "Open command centre",
    },
  ]
  const trustStatus = [
    { label: "Route guards", value: "Active", tone: "text-emerald-600" },
    { label: "Org isolation", value: "Active", tone: "text-emerald-600" },
    { label: "Role-based access", value: "Active", tone: "text-emerald-600" },
    { label: "Backup evidence", value: "Action required", tone: "text-amber-600" },
    { label: "Restore drill", value: "Action required", tone: "text-amber-600" },
    { label: "Fake-data review", value: "Action required", tone: "text-amber-600" },
  ]

  const saveKpis = async () => {
    setKpiSaving(true)
    setKpiError("")
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ kpis: kpiDraft }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save KPIs")
      const updated = Array.isArray(data.kpis) && data.kpis.length ? data.kpis : kpiDraft
      setKpiLayout(updated)
      setKpiDialogOpen(false)
    } catch (err: any) {
      setKpiError(err?.message || "Failed to save KPI layout")
    } finally {
      setKpiSaving(false)
    }
  }

  const formatActivityTime = (value: string) => {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-ai-anchor="overview-header">
            Welcome Back
          </h1>
          <p className="text-muted-foreground mt-1">Here's your business overview for today</p>
          {commandState.stale && <p className="text-xs text-muted-foreground">Showing cached insights.</p>}
          {commandState.error && <p className="text-xs text-destructive">{commandState.error}</p>}
        </div>
        <Dialog open={kpiDialogOpen} onOpenChange={setKpiDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <SlidersHorizontal className="w-4 h-4" />
              Customize KPIs
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personalize KPI cards</DialogTitle>
              <DialogDescription>Pick up to six KPIs to pin on your dashboard.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {KPI_CATALOG.map((kpi) => (
                <label key={kpi.id} className="flex items-start gap-3 border border-border rounded-lg p-3">
                  <Checkbox
                    checked={kpiDraft.includes(kpi.id)}
                    onCheckedChange={() => toggleKpi(kpi.id)}
                  />
                  <div>
                    <p className="font-medium">{kpi.label}</p>
                    <p className="text-xs text-muted-foreground">{kpi.description}</p>
                  </div>
                </label>
              ))}
              {kpiError && <p className="text-xs text-destructive">{kpiError}</p>}
              <Button onClick={saveKpis} disabled={kpiSaving || kpiDraft.length > 6}>
                {kpiSaving ? "Saving..." : "Save KPIs"}
              </Button>
              {kpiDraft.length > 6 && (
                <p className="text-xs text-destructive">Please select six or fewer KPIs.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/30">
          <CardHeader>
            <CardTitle>Civis Pulse</CardTitle>
            <CardDescription>What matters today, what is blocked, and what to do next.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Today&apos;s priorities
              </div>
              <div className="space-y-3">
                {todayPriorities.length ? (
                  todayPriorities.map((item) => (
                    <div key={item.id} className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                      <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                        <Link href={item.href}>{item.action}</Link>
                      </Button>
                    </div>
                  ))
                ) : (
                  <PremiumEmptyState
                    title="Your workspace is still getting started."
                    description="Once invoices, deals, tasks, or approvals exist, Civis Pulse will rank the work that needs attention first."
                    icon={<Rocket className="h-5 w-5" />}
                  />
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Wrench className="h-4 w-4 text-primary" />
                Setup blockers
              </div>
              <div className="space-y-3">
                {setupBlockers.map((item) => (
                  <div key={item.title} className="rounded-xl border border-border p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                    <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                      <Link href={item.href}>{item.cta}</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Trust & security
              </div>
              <div className="space-y-3">
                {trustStatus.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className={`text-sm font-medium ${item.tone}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Suggested next actions</CardTitle>
            <CardDescription>Launch-safe steps that move the workspace forward without pretending missing features are done.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedNextActions.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
                <Button asChild className="mt-4" size="sm">
                  <Link href={item.href}>{item.cta}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Launch setup path</CardTitle>
          <CardDescription>What to configure, validate, and prove before calling this workspace ready.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          {launchSetupPath.map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
              <Button asChild className="mt-4" size="sm" variant="outline">
                <Link href={item.href}>{item.cta}</Link>
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setup Readiness Snapshot</CardTitle>
          <CardDescription>
            These statuses come from real workspace and configuration signals, not manual checkmarks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Verified</p>
              <p className="mt-2 text-3xl font-semibold">{verifiedSetupCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Items the app can confirm as done.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Action required</p>
              <p className="mt-2 text-3xl font-semibold">{setupActionCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Signals still blocking a clean launch story.</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Workspace setup</p>
              <p className="mt-2 text-3xl font-semibold">{setupReadiness?.setupItems?.length || 0}</p>
              <Button asChild className="mt-4" size="sm" variant="outline">
                <Link href="/dashboard/setup">Open setup center</Link>
              </Button>
            </div>
          </div>
          {setupError ? <p className="text-xs text-destructive">{setupError}</p> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {(setupReadiness?.setupItems || []).slice(0, 6).map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {item.status.replace(/-/g, " ")}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{item.nextAction}</p>
                {item.href ? (
                  <Button asChild variant="link" className="mt-2 h-auto p-0 text-primary">
                    <Link href={item.href}>Open</Link>
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((stat) => {
          const Icon = kpiIcons[stat.id] || TrendingUp
          return (
            <Card key={stat.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Live month-to-date performance</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData.length ? (
              <>
                <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
                    Revenue
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#d1d5db]" />
                    Expenses
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#d1d5db" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <PremiumEmptyState
                eyebrow="Accounting"
                title="No financial pulse yet."
                description="Record your first invoice and expense to unlock revenue, expense, and month-to-date performance trends."
                icon={<DollarSign className="h-5 w-5" />}
                primaryAction={
                  <Button asChild size="sm">
                    <Link href="/dashboard/accounting">Open Accounting</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Mix</CardTitle>
            <CardDescription>Current live workload distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {operationalMix.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={operationalMix}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {operationalMix.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <PremiumEmptyState
                eyebrow="Operations"
                title="No operational mix yet."
                description="Once approvals, overdue invoices, or pending expenses exist, this card will show where workload is building up."
                icon={<Package className="h-5 w-5" />}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Decision Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Decision Feed
          </CardTitle>
          <CardDescription>Priority actions that keep revenue and operations moving.</CardDescription>
        </CardHeader>
        <CardContent>
          {decisionFeed.length ? (
            <div className="space-y-4">
              {decisionFeed.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-border rounded-lg p-4 bg-background/60"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${impactStyles[item.impact]}`}>
                      {item.impact} impact
                    </span>
                    <Button size="sm" asChild>
                      <Link href={item.href} className="flex items-center gap-1">
                        {item.action}
                        <ArrowUpRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PremiumEmptyState
              eyebrow="Decision Feed"
              title="Your workspace is quiet for now."
              description="Create invoices, tasks, or approvals and Civis will start surfacing the items that need a real decision."
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivity.length ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pb-4 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatActivityTime(activity.time)}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${activityStatusStyles[activity.status]}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <PremiumEmptyState
              eyebrow="Activity"
              title="No activity yet."
              description="Recent transactions, updates, and audit-backed changes will appear here once the workspace starts being used."
              icon={<TrendingUp className="h-5 w-5" />}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
