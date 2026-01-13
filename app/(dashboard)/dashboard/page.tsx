"use client"

import { useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
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
import { useSession } from "next-auth/react"

const revenueData = [
  { month: "Jan", revenue: 4000, expenses: 2400 },
  { month: "Feb", revenue: 3000, expenses: 1398 },
  { month: "Mar", revenue: 2000, expenses: 9800 },
  { month: "Apr", revenue: 2780, expenses: 3908 },
  { month: "May", revenue: 1890, expenses: 4800 },
  { month: "Jun", revenue: 2390, expenses: 3800 },
]

const salesData = [
  { name: "Online", value: 400, fill: "#48b0f7" },
  { name: "Retail", value: 300, fill: "#0f766e" },
  { name: "B2B", value: 300, fill: "#2d7c8a" },
]

const fallbackRecentActivity = [
  {
    id: "act-1",
    title: "Invoice INV-2025-014 marked as paid",
    detail: "Acme Corp • ₦1,250,000",
    time: "2 hours ago",
    status: "success",
  },
  {
    id: "act-2",
    title: "New lead added to CRM",
    detail: "Northwind Trading • Adaeze Okafor",
    time: "5 hours ago",
    status: "info",
  },
  {
    id: "act-3",
    title: "Payroll batch processed",
    detail: "January payroll • 18 employees",
    time: "Yesterday",
    status: "success",
  },
  {
    id: "act-4",
    title: "Stock alert: Low inventory",
    detail: "Wireless Mouse • Reorder 50 units",
    time: "Yesterday",
    status: "warning",
  },
  {
    id: "act-5",
    title: "Project milestone completed",
    detail: "Website Redesign • Phase 2",
    time: "2 days ago",
    status: "info",
  },
]

const fallbackDecisionFeed = [
  {
    id: "dec-1",
    title: "Overdue invoice needs a follow-up",
    detail: "INV-2025-014 • ₦1,250,000 • 9 days overdue",
    impact: "High",
    action: "Review invoices",
    href: "/dashboard/accounting",
  },
  {
    id: "dec-2",
    title: "Stock reorder recommended",
    detail: "Wireless Mouse • Reorder 50 units",
    impact: "Medium",
    action: "Open inventory",
    href: "/dashboard/inventory",
  },
  {
    id: "dec-3",
    title: "Stalled deal in negotiation",
    detail: "Civis Suite • Northwind • 14 days idle",
    impact: "High",
    action: "Jump to CRM",
    href: "/dashboard/crm",
  },
  {
    id: "dec-4",
    title: "Payroll batch pending approval",
    detail: "January payroll • 18 employees",
    impact: "Medium",
    action: "Review approvals",
    href: "/dashboard/operations",
  },
]

const commandFallback = {
  stats: {
    contacts: 1234,
    openDeals: 18,
    pipelineValue: 3250000,
    revenueMtd: 13256871,
    expensesMtd: 7800000,
    overdueInvoices: 4,
    pendingExpenses: 6,
  },
  decisions: fallbackDecisionFeed,
  recentActivity: fallbackRecentActivity,
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

  const commandState = useCachedFetch(
    "civis_dashboard_command",
    async () => {
      const res = await fetch("/api/ops/command", { headers: { ...getSessionHeaders() } })
      if (res.status === 503) return commandFallback
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load dashboard insights")
      return data
    },
    1000 * 60 * 5,
  )

  const commandData = commandState.data || commandFallback
  const commandHasSignal =
    commandData?.stats &&
    Object.values(commandData.stats).some((value) => typeof value === "number" && value > 0)
  const command = commandHasSignal ? commandData : commandFallback

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

  const decisionFeed = command.decisions?.length ? command.decisions : fallbackDecisionFeed
  const recentActivity = command.recentActivity?.length ? command.recentActivity : fallbackRecentActivity

  const toggleKpi = (id: string) => {
    setKpiDraft((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
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
          <h1 className="text-3xl font-bold">Welcome Back</h1>
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
            <CardDescription>Monthly performance</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#d1d5db" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
            <CardDescription>Distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
