"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, DollarSign, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const revenueData = [
  { month: "Jan", revenue: 45000, expenses: 32000 },
  { month: "Feb", revenue: 52000, expenses: 35000 },
  { month: "Mar", revenue: 48000, expenses: 33000 },
  { month: "Apr", revenue: 61000, expenses: 38000 },
  { month: "May", revenue: 55000, expenses: 36000 },
  { month: "Jun", revenue: 67000, expenses: 41000 },
]

const salesData = [
  { name: "Direct Sales", value: 35 },
  { name: "Online", value: 28 },
  { name: "Partners", value: 22 },
  { name: "Other", value: 15 },
]

const customerGrowth = [
  { month: "Jan", customers: 450 },
  { month: "Feb", customers: 520 },
  { month: "Mar", customers: 480 },
  { month: "Apr", customers: 610 },
  { month: "May", customers: 680 },
  { month: "Jun", customers: 750 },
]

const COLORS = ["#0891b2", "#06b6d4", "#22d3ee", "#cffafe"]

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export default function AnalyticsPage() {
  const [exportEmail, setExportEmail] = useState("ikchils@gmail.com")

  const handleExport = async (target: "desktop" | "email") => {
    try {
      if (target === "desktop") {
        const res = await fetch("/api/reports/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "analytics", target: "desktop" }),
        })
        if (!res.ok) throw new Error("Failed to export")
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "analytics-report.csv"
        link.click()
        window.URL.revokeObjectURL(url)
        return
      }

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "analytics", target: "email", email: exportEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to send email")
        return
      }
      alert(data.message || "Report sent")
    } catch (err) {
      alert("Export failed. Please try again.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground mt-1">Comprehensive business metrics and performance tracking</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-2">{formatNaira(328000)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Customers</p>
                <p className="text-2xl font-bold mt-2">750</p>
              </div>
              <Users className="w-8 h-8 text-accent/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders This Month</p>
                <p className="text-2xl font-bold mt-2">1,247</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold mt-2">+24.5%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#0891b2]" />
                Revenue
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                Expenses
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sales by Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Sales by Channel</CardTitle>
            <CardDescription>Distribution breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#0891b2"
                  dataKey="value"
                >
                  {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>Last 6 months trend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="customers" fill="#0891b2" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key business metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Average Order Value</span>
                <span className="font-semibold">{formatNaira(263.5)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Customer Retention</span>
                <span className="font-semibold">92.3%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">3.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Net Profit Margin</span>
                <span className="font-semibold">24.7%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Market Share Growth</span>
                <span className="font-semibold text-green-600">+15.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exports */}
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>Send CSV via email or download to desktop</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="export-email">
                Email address
              </label>
              <Input
                id="export-email"
                type="email"
                value={exportEmail}
                onChange={(e) => setExportEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => handleExport("desktop")}>
                Export to desktop (CSV)
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => handleExport("email")}>
                Email CSV report
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This is a demo flow; actual exports will require backend wiring to generate and send files.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
