"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ArrowRight, Building2, FolderKanban, LockKeyhole, Users, Workflow } from "lucide-react"
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

const numberCards = [
  { key: "userCount", label: "Team members", icon: Users },
  { key: "adminCount", label: "Admins", icon: LockKeyhole },
  { key: "workflowCount", label: "Live workflows", icon: Workflow },
  { key: "activeProjectCount", label: "Active projects", icon: FolderKanban },
] as const

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
    return <p className="text-sm text-slate-300">Loading admin overview...</p>
  }

  if (!data) {
    return <p className="text-sm text-rose-300">{error || "Admin overview unavailable."}</p>
  }

  const { workspace, actor, platform } = data

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-2xl">Control plane for {workspace.org.name}</CardTitle>
              <CardDescription className="text-slate-400">
                Govern access, monitor workspace health, and keep stakeholder admins inside their own boundary.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">{actor.role}</Badge>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                Founder lock: {actor.founderEmail}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {numberCards.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <Icon className="h-4 w-4 text-emerald-300" />
                </div>
                <p className="text-3xl font-semibold">{workspace.summary[item.key]}</p>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>Workspace health</CardTitle>
            <CardDescription className="text-slate-400">
              Live admin metrics across people, delivery, finance, and governance.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">2FA enabled</p>
              <p className="mt-2 text-2xl font-semibold">
                {workspace.summary.twoFactorCount} / {workspace.summary.userCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Open CRM contacts</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.summary.contactCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Portal links live</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.summary.activePortalCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">People records</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.summary.employeeCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Overdue invoices</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.summary.overdueInvoiceCount}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">Pending expenses</p>
              <p className="mt-2 text-2xl font-semibold">{workspace.summary.pendingExpenseCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>Admin operating rules</CardTitle>
            <CardDescription className="text-slate-400">
              Civis now enforces a founder-locked super-admin policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              Only the founder email can hold the <strong>SUPER_ADMIN</strong> role.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              Stakeholder admins can manage users in their own workspace, but cannot cross org boundaries.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              Every admin user change now writes to the audit log for traceability.
            </div>
            <Button className="w-full justify-between" asChild>
              <Link href="/admin/users">
                Open user management
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Recent admin activity</CardTitle>
          <CardDescription className="text-slate-400">
            Fast visibility into changes happening inside this workspace.
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
                    No recent admin events yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {platform ? (
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Platform snapshot</CardTitle>
                <CardDescription className="text-slate-400">
                  Your founder-level view across workspaces.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                {platform.totalOrgs} workspaces / {platform.totalUsers} users
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {platform.recentOrgs.map((workspaceItem) => (
              <div key={workspaceItem.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{workspaceItem.name}</p>
                    <p className="text-xs text-slate-400">{workspaceItem.notifyEmail || "No notify email set"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div>Users: {workspaceItem._count.users}</div>
                  <div>Contacts: {workspaceItem._count.contacts}</div>
                  <div>Deals: {workspaceItem._count.deals}</div>
                  <div>Invoices: {workspaceItem._count.invoices}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
