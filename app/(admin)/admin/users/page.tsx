"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Copy, RotateCcw, Trash2, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ACCESS_PROFILE_DESCRIPTIONS,
  ACCESS_PROFILE_LABELS,
  ACCESS_PROFILES,
  type AccessProfile,
} from "@/lib/access-control"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"

type AssignableRole = "USER" | "ADMIN" | "ORG_OWNER"

type AdminUser = {
  id: string
  name: string
  email: string
  role: "USER" | "ADMIN" | "ORG_OWNER" | "SUPER_ADMIN"
  accessProfile: AccessProfile
  accessSummary: string[]
  title?: string | null
  twoFactorEnabled?: boolean
  invitePending?: boolean
  createdAt: string
}

type UsersResponse = {
  users: AdminUser[]
  assignableRoles: AssignableRole[]
  accessProfiles: AccessProfile[]
}

type InvitePayload = {
  email: string
  inviteUrl: string
  expiresAt: string
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<UsersResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [lastInvite, setLastInvite] = useState<InvitePayload | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    role: "USER" as AssignableRole,
    accessProfile: "GENERAL" as AccessProfile,
  })

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
        accessProfile: payload.accessProfiles?.includes(current.accessProfile) ? current.accessProfile : "GENERAL",
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
      setLastInvite(
        payload.invite
          ? {
              email: payload.user?.email || form.email,
              inviteUrl: payload.invite.inviteUrl,
              expiresAt: payload.invite.expiresAt,
            }
          : null,
      )
      setForm({
        name: "",
        email: "",
        title: "",
        role: data?.assignableRoles?.[0] || "USER",
        accessProfile: "GENERAL",
      })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite user")
    } finally {
      setSaving(false)
    }
  }

  const handleResendInvite = async (member: AdminUser) => {
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: member.name,
          email: member.email,
          title: member.title || "",
          role: member.role === "SUPER_ADMIN" ? "ADMIN" : member.role,
          accessProfile: member.accessProfile,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to refresh invite")
      setSuccess(payload.message || "Invite refreshed.")
      setLastInvite(
        payload.invite
          ? {
              email: member.email,
              inviteUrl: payload.invite.inviteUrl,
              expiresAt: payload.invite.expiresAt,
            }
          : null,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh invite")
    } finally {
      setSaving(false)
    }
  }

  const copyInvite = async (inviteUrl: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setSuccess("Invite link copied.")
    } catch {
      setError("Failed to copy invite link.")
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

  const handleAccessProfileChange = async (userId: string, accessProfile: AccessProfile) => {
    try {
      setError("")
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, accessProfile }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to update access profile")
      setData((current) =>
        current
          ? {
              ...current,
              users: current.users.map((item) => (item.id === userId ? payload.user : item)),
            }
          : current,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update access profile")
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
            Invite teammates, assign organization owners or admins, and keep founder access immutable.
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
              <Select
                value={form.role}
                onValueChange={(value: AssignableRole) =>
                  setForm((current) => ({
                    ...current,
                    role: value,
                    accessProfile:
                      value === "ORG_OWNER" ? "EXECUTIVE" : value === "ADMIN" ? "ADMINISTRATION" : current.accessProfile,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(data?.assignableRoles || ["USER"]).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Access profile</Label>
              <Select
                value={form.accessProfile}
                onValueChange={(value: AccessProfile) => setForm((current) => ({ ...current, accessProfile: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(data?.accessProfiles || ACCESS_PROFILES).map((profile) => (
                    <SelectItem key={profile} value={profile}>
                      {ACCESS_PROFILE_LABELS[profile]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">{ACCESS_PROFILE_DESCRIPTIONS[form.accessProfile]}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-300">
            <p className="font-medium text-slate-100">Invite flow</p>
            <p className="mt-2">
              Civis now creates the user record and generates a real signup link. The teammate uses that link to activate
              the workspace account you assigned here.
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
      {lastInvite ? (
        <Card className="border-white/10 bg-white/5 text-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Latest invite link</CardTitle>
            <CardDescription className="text-slate-400">
              Share this exact link with {lastInvite.email}. It expires on {new Date(lastInvite.expiresAt).toLocaleString()}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <Input value={lastInvite.inviteUrl} readOnly className="border-white/10 bg-slate-950/50" />
            <Button type="button" variant="outline" onClick={() => copyInvite(lastInvite.inviteUrl)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
                  <TableHead className="text-slate-300">Access</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">2FA</TableHead>
                  <TableHead className="text-slate-300">Created</TableHead>
                  <TableHead className="text-slate-300 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.users || []).map((member) => {
                  const isFounder = member.email.toLowerCase() === founderEmail
                  const isSelf = member.email.toLowerCase() === session?.user?.email?.toLowerCase()
                  const canEditMemberRole = !isFounder && member.role !== "SUPER_ADMIN" && data?.assignableRoles.includes(member.role as AssignableRole)
                  const canEditAccessProfile = canEditMemberRole
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
                        {isFounder || !canEditMemberRole ? (
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                            {member.role}
                          </Badge>
                        ) : (
                          <Select
                            value={member.role}
                            onValueChange={(value: AssignableRole) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-36 border-white/10 bg-slate-950/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(data?.assignableRoles || ["USER"]).map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEditAccessProfile ? (
                          <div className="space-y-2">
                            <Select
                              value={member.accessProfile}
                              onValueChange={(value: AccessProfile) => handleAccessProfileChange(member.id, value)}
                            >
                              <SelectTrigger className="w-44 border-white/10 bg-slate-950/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(data?.accessProfiles || ACCESS_PROFILES).map((profile) => (
                                  <SelectItem key={profile} value={profile}>
                                    {ACCESS_PROFILE_LABELS[profile]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="max-w-xs text-xs text-slate-400">
                              {member.accessSummary.length ? member.accessSummary.join(", ") : "No workspace modules assigned yet."}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">
                              {member.role === "SUPER_ADMIN" ? "Founder access" : ACCESS_PROFILE_LABELS[member.accessProfile]}
                            </Badge>
                            <p className="max-w-xs text-xs text-slate-400">
                              {member.accessSummary.length ? member.accessSummary.join(", ") : "Full privileged access."}
                            </p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.invitePending ? (
                          <Badge className="bg-amber-500/15 text-amber-300 hover:bg-amber-500/15">Invite pending</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>{member.twoFactorEnabled ? "Enabled" : "Not enabled"}</TableCell>
                      <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {member.invitePending ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-300 hover:text-slate-100"
                              disabled={saving}
                              onClick={() => handleResendInvite(member)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-300 hover:text-rose-200"
                            disabled={isFounder || isSelf}
                            onClick={() => handleDelete(member.id, member.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
