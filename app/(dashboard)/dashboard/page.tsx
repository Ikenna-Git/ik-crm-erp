"use client"

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
import { TrendingUp, Users, DollarSign, Package, AlertTriangle, ArrowUpRight } from "lucide-react"
import { formatNaira } from "@/lib/currency"

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

const statsCards = [
  { icon: Users, label: "Total Contacts", value: "1,234", change: "+12%" },
  { icon: DollarSign, label: "Revenue (MTD)", value: formatNaira(13256871), change: "+8%" },
  { icon: Package, label: "Orders", value: "328", change: "+5%" },
  { icon: TrendingUp, label: "Growth Rate", value: "23%", change: "+3%" },
]

const recentActivity = [
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

const decisionFeed = [
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

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground mt-1">Here's your business overview for today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
                    <p className="text-xs text-primary mt-1">{stat.change} from last month</p>
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
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
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
