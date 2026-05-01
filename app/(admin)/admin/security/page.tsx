"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, LockKeyhole, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type SecurityResponse = {
  summary: {
    userCount: number
    privilegedUserCount: number
    twoFactorCoverage: number
    founderEmail: string
  }
  privilegedUsers: Array<{
    id: string
    name: string
    email: string
    role: string
    twoFactorEnabled: boolean
    createdAt: string
  }>
  recentAuditEvents: Array<{
    id: string
    action: string
    entity?: string | null
    createdAt: string
  }>
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/admin/security")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load security view")
        setData(payload)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load security view")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-300">Loading security view...</p>
  }

  if (!data) {
    return <p className="text-sm text-rose-300">{error || "Security view unavailable."}</p>
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">2FA coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.summary.twoFactorCoverage}%</p>
            <p className="mt-2 text-sm text-slate-400">
              {data.summary.userCount} total users, with security posture measured from enabled 2FA.
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Privileged accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.summary.privilegedUserCount}</p>
            <p className="mt-2 text-sm text-slate-400">Organization owners, admins, and the founder super-admin are surfaced below.</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Founder lock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{data.summary.founderEmail}</p>
            <p className="mt-2 text-sm text-slate-400">Only this email can ever retain the SUPER_ADMIN role.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Privileged user roster</CardTitle>
          <CardDescription className="text-slate-400">
            Direct visibility into who can administer this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-slate-300">User</TableHead>
                <TableHead className="text-slate-300">Role</TableHead>
                <TableHead className="text-slate-300">2FA</TableHead>
                <TableHead className="text-slate-300">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.privilegedUsers.map((member) => (
                <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">{member.role}</Badge>
                  </TableCell>
                  <TableCell>{member.twoFactorEnabled ? "Enabled" : "Missing"}</TableCell>
                  <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>Recent audit activity</CardTitle>
            <CardDescription className="text-slate-400">
              Security-relevant changes across team management and workspace updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentAuditEvents.length ? (
              data.recentAuditEvents.map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center gap-2">
                    <LockKeyhole className="h-4 w-4 text-emerald-300" />
                    <p className="font-medium">{event.action}</p>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    {event.entity || "System"} • {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No audit records yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle>Immediate hardening actions</CardTitle>
            <CardDescription className="text-slate-400">
              These are the fastest practical steps to reduce admin risk now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Push all admins to enable 2FA before wider rollout.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-300" />
                Keep founder access isolated from day-to-day stakeholder administration.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-emerald-300" />
                Review audit events after each admin invite or role change until release discipline is stable.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
