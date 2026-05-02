"use client"

import { useEffect, useMemo, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, DollarSign, Package, AlertTriangle, ArrowUpRight, SlidersHorizontal } from "lucide-react"
import { formatNaira } from "@/lib/currency"
import { useCachedFetch } from "@/hooks/use-cached-fetch"
import { getSessionHeaders } from "@/lib/user-settings"
import { KPI_CATALOG, getDefaultKpis } from "@/lib/kpis"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useSession } from "next-auth/react"
import { DEFAULT_ONBOARDING_TASKS, type OnboardingTask } from "@/lib/user-settings"

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

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const [kpiLayout, setKpiLayout] = useState<string[]>([])
  const [kpiDraft, setKpiDraft] = useState<string[]>([])
  const [kpiDialogOpen, setKpiDialogOpen] = useState(false)
  const [kpiError, setKpiError] = useState("")
  const [kpiSaving, setKpiSaving] = useState(false)
  const [onboarding, setOnboarding] = useState<OnboardingTask[]>(DEFAULT_ONBOARDING_TASKS)
  const [onboardingError, setOnboardingError] = useState("")

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
          setOnboarding(DEFAULT_ONBOARDING_TASKS)
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load settings")
        const incoming = Array.isArray(data.kpis) && data.kpis.length ? data.kpis : getDefaultKpis(role)
        setKpiLayout(incoming)
        setKpiDraft(incoming)
        if (Array.isArray(data.onboarding) && data.onboarding.length) {
          setOnboarding(data.onboarding)
        } else {
          setOnboarding(DEFAULT_ONBOARDING_TASKS)
        }
      } catch (err: any) {
        setKpiError(err?.message || "Failed to load KPI settings")
        const defaults = getDefaultKpis(role)
        setKpiLayout(defaults)
        setKpiDraft(defaults)
        setOnboarding(DEFAULT_ONBOARDING_TASKS)
        setOnboardingError("Failed to load onboarding checklist")
      }
    }
    loadKpis()
  }, [role])

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

  const decisionFeed = Array.isArray(command.decisions) ? command.decisions : []
  const recentActivity = Array.isArray(command.recentActivity) ? command.recentActivity : []

  const toggleKpi = (id: string) => {
    setKpiDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const completedOnboarding = onboarding.filter((task) => task.done).length
  const onboardingProgress = onboarding.length ? Math.round((completedOnboarding / onboarding.length) * 100) : 0

  const toggleOnboardingTask = async (id: string) => {
    const current = onboarding
    const next = onboarding.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    setOnboarding(next)
    setOnboardingError("")
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ onboarding: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update onboarding")
      if (Array.isArray(data.onboarding)) {
        setOnboarding(data.onboarding)
      }
    } catch (err: any) {
      setOnboardingError(err?.message || "Failed to save onboarding updates")
      setOnboarding(current)
    }
  }

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

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Checklist</CardTitle>
          <CardDescription>Finish these steps to unlock the full Civis experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completedOnboarding} of {onboarding.length} completed
            </span>
            <span className="font-semibold">{onboardingProgress}%</span>
          </div>
          <Progress value={onboardingProgress} />
          {onboardingError ? <p className="text-xs text-destructive">{onboardingError}</p> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {onboarding.map((task) => (
              <div key={task.id} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                <Checkbox checked={task.done} onCheckedChange={() => toggleOnboardingTask(task.id)} />
                <div className="space-y-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.description}</p>
                  {task.href ? (
                    <Button asChild variant="link" className="h-auto p-0 text-primary">
                      <Link href={task.href}>Open</Link>
                    </Button>
                  ) : null}
                </div>
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
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                No financial performance data yet.
              </div>
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
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                No operational mix data yet.
              </div>
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
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No urgent decisions right now. This feed will populate as your org creates invoices, deals, tasks, and approvals.
            </div>
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
            <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              No activity yet. Recent transactions and updates will appear here after the workspace starts being used.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
