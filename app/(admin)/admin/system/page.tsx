"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Building2, Cpu, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { isSuperAdmin } from "@/lib/authz"

type OrgRecord = {
  id: string
  name: string
  theme?: string | null
  notifyEmail?: string | null
  createdAt: string
  updatedAt: string
  _count: {
    users: number
    contacts: number
    employees: number
    deals: number
    invoices: number
    automationWorkflows: number
  }
}

export default function AdminSystemPage() {
  const { data: session } = useSession()
  const [orgs, setOrgs] = useState<OrgRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    name: "",
    theme: "light",
    notifyEmail: "",
    adminName: "",
    adminEmail: "",
  })

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch("/api/admin/orgs")
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to load workspaces")
      setOrgs(payload.orgs || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSuperAdmin(session?.user?.role)) {
      load()
    }
  }, [session?.user?.role])

  const handleCreateWorkspace = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/orgs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to create workspace")
      setSuccess(payload.message || "Workspace created.")
      setForm({ name: "", theme: "light", notifyEmail: "", adminName: "", adminEmail: "" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create workspace")
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin(session?.user?.role)) {
    return (
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Platform super-admin only</CardTitle>
          <CardDescription className="text-slate-400">
            This page is reserved for the founder-level control plane.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Create stakeholder workspace</CardTitle>
              <CardDescription className="text-slate-400">
                Stand up a new org and seed the first workspace admin without surrendering founder control.
              </CardDescription>
            </div>
            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Founder only</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Workspace name</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notify email</Label>
              <Input
                value={form.notifyEmail}
                onChange={(event) => setForm((current) => ({ ...current, notifyEmail: event.target.value }))}
                placeholder="ops@workspace.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Initial admin name</Label>
              <Input
                value={form.adminName}
                onChange={(event) => setForm((current) => ({ ...current, adminName: event.target.value }))}
                placeholder="Adaeze Okafor"
              />
            </div>
            <div className="space-y-2">
              <Label>Initial admin email</Label>
              <Input
                value={form.adminEmail}
                onChange={(event) => setForm((current) => ({ ...current, adminEmail: event.target.value }))}
                placeholder="admin@workspace.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Theme mode</Label>
              <Select value={form.theme} onValueChange={(value) => setForm((current) => ({ ...current, theme: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <div className="mb-3 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-emerald-300" />
              <p className="font-medium text-slate-100">Provisioning note</p>
            </div>
            <p>
              Civis creates the workspace and its initial admin record now. The stakeholder admin completes signup later
              using the same email address you seed here.
            </p>
            <Button className="mt-4 w-full" onClick={handleCreateWorkspace} disabled={saving}>
              {saving ? "Creating workspace..." : "Create workspace"}
            </Button>
            {error ? <p className="mt-3 text-rose-300">{error}</p> : null}
            {success ? <p className="mt-3 text-emerald-300">{success}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Workspace registry</CardTitle>
          <CardDescription className="text-slate-400">
            The founder-level view of every organization currently provisioned in Civis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-300">Loading workspaces...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">Workspace</TableHead>
                  <TableHead className="text-slate-300">Users</TableHead>
                  <TableHead className="text-slate-300">Ops</TableHead>
                  <TableHead className="text-slate-300">Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={org.id} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.notifyEmail || "No notify email"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{org._count.users}</TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-300">
                        <div>Employees: {org._count.employees}</div>
                        <div>Workflows: {org._count.automationWorkflows}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <Cpu className="h-4 w-4 text-emerald-300" />
                        Updated {new Date(org.updatedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
