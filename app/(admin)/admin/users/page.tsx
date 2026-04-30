"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"

type AdminUser = {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "SUPER_ADMIN"
  title?: string | null
  twoFactorEnabled?: boolean
  createdAt: string
}

type UsersResponse = {
  users: AdminUser[]
  assignableRoles: Array<"USER" | "ADMIN">
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({ name: "", email: "", title: "", role: "USER" as "USER" | "ADMIN" })

  const founderEmail = useMemo(() => FOUNDER_SUPER_ADMIN_EMAIL, [])

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await fetch("/api/admin/users")
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to load users")
      setData(payload)
      setForm((current) => ({
        ...current,
        role: payload.assignableRoles?.includes(current.role) ? current.role : payload.assignableRoles?.[0] || "USER",
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleInvite = async () => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to invite user")
      setSuccess(payload.message || "User created.")
      setForm({ name: "", email: "", title: "", role: data?.assignableRoles?.[0] || "USER" })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user")
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (userId: string, role: AdminUser["role"]) => {
    try {
      setError("")
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to update role")
      setData((current) =>
        current
          ? {
              ...current,
              users: current.users.map((item) => (item.id === userId ? payload.user : item)),
            }
          : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!window.confirm(`Remove ${email} from this workspace?`)) return
    try {
      setError("")
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to remove user")
      setData((current) =>
        current
          ? {
              ...current,
              users: current.users.filter((item) => item.id !== userId),
            }
          : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove user")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>User management</CardTitle>
          <CardDescription className="text-slate-400">
            Invite teammates, promote workspace admins, and keep founder access immutable.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Adaeze Okafor"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="adaeze@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Operations Lead"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(value: "USER" | "ADMIN") => setForm((current) => ({ ...current, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(data?.assignableRoles || ["USER", "ADMIN"]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p className="font-medium text-slate-100">Invite flow</p>
            <p className="mt-2">
              Civis creates the user record now. The teammate completes signup later with the same email address and gets
              the role you assigned here.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Founder super-admin remains locked to <strong>{founderEmail}</strong>.
            </p>
            <Button className="mt-4 w-full justify-between" onClick={handleInvite} disabled={saving}>
              {saving ? "Creating user..." : "Create user"}
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}

      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Workspace team</CardTitle>
          <CardDescription className="text-slate-400">
            Roles, 2FA coverage, and removal controls for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-300">Loading team members...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-300">User</TableHead>
                  <TableHead className="text-slate-300">Role</TableHead>
                  <TableHead className="text-slate-300">2FA</TableHead>
                  <TableHead className="text-slate-300">Created</TableHead>
                  <TableHead className="text-slate-300 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.users || []).map((member) => {
                  const isFounder = member.email.toLowerCase() === founderEmail
                  const isSelf = member.email.toLowerCase() === session?.user?.email?.toLowerCase()
                  return (
                    <TableRow key={member.id} className="border-white/10 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-slate-400">{member.email}</p>
                          {member.title ? <p className="text-xs text-slate-500">{member.title}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isFounder ? (
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            SUPER_ADMIN
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value: AdminUser["role"]) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-36 border-white/10 bg-slate-950/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(data?.assignableRoles || ["USER", "ADMIN"]).map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{member.twoFactorEnabled ? "Enabled" : "Not enabled"}</TableCell>
                      <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-300 hover:text-rose-200"
                          disabled={isFounder || isSelf}
                          onClick={() => handleDelete(member.id, member.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
