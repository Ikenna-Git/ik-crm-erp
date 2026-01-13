"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
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

const fallbackPipeline = [
  { stage: "PROSPECT", count: 6, value: 900000 },
  { stage: "QUALIFIED", count: 4, value: 650000 },
  { stage: "PROPOSAL", count: 3, value: 520000 },
  { stage: "NEGOTIATION", count: 2, value: 420000 },
  { stage: "WON", count: 1, value: 210000 },
]

const fallbackContacts = [
  { status: "LEAD", count: 18, fill: "#0f766e" },
  { status: "PROSPECT", count: 11, fill: "#2d7c8a" },
  { status: "CUSTOMER", count: 7, fill: "#48b0f7" },
]

const stageColors = ["#0f766e", "#2d7c8a", "#48b0f7", "#a0d8f0", "#7c3aed", "#f97316"]

export function CrmReports() {
  const [pipeline, setPipeline] = useState(fallbackPipeline)
  const [contactStatus, setContactStatus] = useState(fallbackContacts)
  const [topDeals, setTopDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/reports/summary?type=crm", {
          headers: { ...getSessionHeaders() },
        })
        if (res.status === 503) return
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load CRM reports")
        if (Array.isArray(data.summary?.pipeline)) {
          setPipeline(
            data.summary.pipeline.map((entry: any, idx: number) => ({
              stage: entry.stage,
              count: entry.count,
              value: entry.value,
              fill: stageColors[idx % stageColors.length],
            })),
          )
        }
        if (Array.isArray(data.summary?.contactStatus)) {
          setContactStatus(
            data.summary.contactStatus.map((entry: any, idx: number) => ({
              status: entry.status,
              count: entry.count,
              fill: stageColors[idx % stageColors.length],
            })),
          )
        }
        if (Array.isArray(data.summary?.topDeals)) {
          setTopDeals(data.summary.topDeals)
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load CRM reports")
      } finally {
        setLoading(false)
      }
    }
    loadSummary()
  }, [])

  const totalPipelineValue = pipeline.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
            <p className="text-3xl font-bold text-primary">{formatNaira(totalPipelineValue)}</p>
            <p className="text-xs text-muted-foreground mt-2">Active stages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Deals in Motion</p>
            <p className="text-3xl font-bold">{pipeline.reduce((sum, item) => sum + item.count, 0)}</p>
            <p className="text-xs text-muted-foreground mt-2">Across all stages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Qualified Contacts</p>
            <p className="text-3xl font-bold">{contactStatus.reduce((sum, item) => sum + item.count, 0)}</p>
            <p className="text-xs text-muted-foreground mt-2">Leads to customers</p>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-xs text-muted-foreground">Updating CRM insights...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Stage</CardTitle>
            <CardDescription>Value distribution across stages.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pipeline.map((entry, idx) => (
                    <Cell key={entry.stage} fill={entry.fill || stageColors[idx % stageColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Health</CardTitle>
            <CardDescription>Distribution of contacts by status.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={contactStatus} dataKey="count" nameKey="status" innerRadius={60} outerRadius={100}>
                  {contactStatus.map((entry, idx) => (
                    <Cell key={entry.status} fill={entry.fill || stageColors[idx % stageColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {contactStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <span>{item.status}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Deals</CardTitle>
          <CardDescription>Highest value deals needing attention.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {topDeals.length ? (
            topDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <p className="font-medium">{deal.title}</p>
                  <p className="text-sm text-muted-foreground">{deal.company}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{formatNaira(deal.value)}</p>
                  <Badge variant="outline">{deal.stage}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No deals yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
