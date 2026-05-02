"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { ArrowRight, Building2, CreditCard, Palette, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type WorkspaceResponse = {
  org: {
    id: string
    name: string
    theme?: string | null
    notifyEmail?: string | null
    createdAt: string
  }
  summary: {
    userCount: number
    adminCount: number
    crmFieldCount: number
  }
  permissions: {
    canManageWorkspace: boolean
    canManageBilling: boolean
    isPlatformSuperAdmin: boolean
  }
}

export default function AdminWorkspacePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<WorkspaceResponse | null>(null)
  const [form, setForm] = useState({ name: "", theme: "light", notifyEmail: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/admin/workspace")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load workspace")
        setData(payload)
        setForm({
          name: payload.org.name || "",
          theme: payload.org.theme || "light",
          notifyEmail: payload.org.notifyEmail || "",
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workspace")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSave = async () => {
    if (!data?.permissions?.canManageWorkspace) return
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to update workspace")
      setData((current) => (current ? { ...current, org: payload.org } : current))
      setSuccess("Workspace settings saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update workspace")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-300">Loading workspace controls...</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
          <CardDescription className="text-slate-400">
            Control the visible identity and notification routing for this workspace. Owners change workspace controls.
            Admins can inspect them without crossing the ownership boundary.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Workspace name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                disabled={!data?.permissions?.canManageWorkspace}
              />
            </div>
            <div className="space-y-2">
              <Label>Notify email</Label>
              <Input
                value={form.notifyEmail}
                onChange={(event) => setForm((current) => ({ ...current, notifyEmail: event.target.value }))}
                placeholder="ops@company.com"
                disabled={!data?.permissions?.canManageWorkspace}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme mode</Label>
              <Select
                value={form.theme}
                onValueChange={(value) => setForm((current) => ({ ...current, theme: value }))}
                disabled={!data?.permissions?.canManageWorkspace}
              >
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
            <Button className="w-fit" onClick={handleSave} disabled={saving || !data?.permissions?.canManageWorkspace}>
              {saving ? "Saving..." : data?.permissions?.canManageWorkspace ? "Save workspace" : "Owner access required"}
            </Button>
            {!data?.permissions?.canManageWorkspace ? (
              <p className="text-xs text-amber-300">
                {session?.user?.role === "ADMIN"
                  ? "Workspace admins can manage people and permissions, but only organization owners can change workspace settings."
                  : "This workspace is view-only from your current access level."}
              </p>
            ) : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Workspace footprint</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <div>Users: {data?.summary.userCount || 0}</div>
                <div>Admins: {data?.summary.adminCount || 0}</div>
                <div>CRM field presets: {data?.summary.crmFieldCount || 0}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Palette className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Governance guardrail</p>
              </div>
              <p className="text-sm text-slate-300">
                Org owners control workspace identity and billing decisions. Workspace admins manage people access. Platform org
                creation and founder controls stay in the super-admin system page.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Next step</p>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-between border-white/10 bg-transparent text-slate-100" asChild>
                  <Link href="/admin/users">
                    Open team, roles, and job access
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between border-white/10 bg-transparent text-slate-100" asChild>
                  <Link href="/admin/billing">
                    Review billing and seats
                    <CreditCard className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
