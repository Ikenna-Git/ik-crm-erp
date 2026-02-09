"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { getSessionHeaders } from "@/lib/user-settings"
import { formatNaira } from "@/lib/currency"

const fallbackMonthlyData = [
  { month: "Jan", revenue: 45000, expenses: 32000, profit: 13000 },
  { month: "Feb", revenue: 52000, expenses: 35000, profit: 17000 },
  { month: "Mar", revenue: 48000, expenses: 33000, profit: 15000 },
  { month: "Apr", revenue: 61000, expenses: 38000, profit: 23000 },
  { month: "May", revenue: 55000, expenses: 36000, profit: 19000 },
  { month: "Jun", revenue: 67000, expenses: 40000, profit: 27000 },
]

const fallbackExpenseBreakdown = [
  { name: "Salaries", value: 40, fill: "#0f766e" },
  { name: "Operations", value: 25, fill: "#2d7c8a" },
  { name: "Marketing", value: 20, fill: "#48b0f7" },
  { name: "Other", value: 15, fill: "#a0d8f0" },
]

export function FinancialReports() {
  const [monthlyData, setMonthlyData] = useState(fallbackMonthlyData)
  const [expenseBreakdown, setExpenseBreakdown] = useState(fallbackExpenseBreakdown)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/reports/summary?type=accounting", {
          headers: { ...getSessionHeaders() },
        })
        if (res.status === 503) return
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load reports")
        const months = Array.isArray(data.summary?.months) ? data.summary.months : []
        const hasSignal = months.some(
          (entry: any) => Number(entry.revenue || 0) > 0 || Number(entry.expenses || 0) > 0 || Number(entry.profit || 0) > 0,
        )
        if (months.length && hasSignal) {
          setMonthlyData(
            months.map((entry: any) => ({
              month: entry.month,
              revenue: entry.revenue,
              expenses: entry.expenses,
              profit: entry.profit,
            })),
          )
          setInfo("")
        } else {
          setInfo("No accounting data yet. Showing demo insights for now.")
        }
        const breakdown = Array.isArray(data.summary?.expenseBreakdown) ? data.summary.expenseBreakdown : []
        const hasBreakdown = breakdown.some((entry: any) => Number(entry.value || 0) > 0)
        if (breakdown.length && hasBreakdown) {
          setExpenseBreakdown(
            breakdown.map((entry: any, idx: number) => ({
              name: entry.name,
              value: entry.value,
              fill: fallbackExpenseBreakdown[idx % fallbackExpenseBreakdown.length].fill,
            })),
          )
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load reports")
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0)
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0)
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold text-primary">{formatNaira(totalRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-3xl font-bold text-accent">{formatNaira(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground mt-2">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-3xl font-bold text-green-600">{formatNaira(totalProfit)}</p>
            <p className="text-xs text-muted-foreground mt-2">Last 6 months</p>
          </CardContent>
        </Card>
      </div>
      {loading && <p className="text-xs text-muted-foreground">Updating report data...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && info && <p className="text-xs text-muted-foreground">{info}</p>}

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expenses</CardTitle>
          <CardDescription>Monthly comparison over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
              Revenue
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f87171]" />
              Expenses
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
              Profit
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} />
              <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Profit Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Trend</CardTitle>
          <CardDescription>Monthly profit margins</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            Profit
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="profit" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {expenseBreakdown.map((item) => (
                <div key={item.name} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>Key financial indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Profit Margin</span>
              <span className="font-semibold">{((totalProfit / totalRevenue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Expense Ratio</span>
              <span className="font-semibold">{((totalExpenses / totalRevenue) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-border">
              <span className="text-muted-foreground">Avg Monthly Revenue</span>
              <span className="font-semibold">{formatNaira(totalRevenue / 6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Monthly Expenses</span>
              <span className="font-semibold">{formatNaira(totalExpenses / 6)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
