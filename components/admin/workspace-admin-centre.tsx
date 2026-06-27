"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserCog,
  UserMinus,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getSessionHeaders } from "@/lib/user-settings"
import { canViewFounderControls } from "@/lib/authz"
import { requestJson, getApiErrorMessage } from "@/lib/api-client"

type PrivacyLockSetting = {
  module: "hr" | "accounting"
  label: string
  configured: boolean
  source: "org" | "legacy-env" | "none"
  pinVersion: number | null
  updatedAt: string | null
  updatedBy: string | null
  lastRotatedAt: string | null
  lastRotatedBy: string | null
}

type SetupItem = {
  id: string
  label: string
  status: string
  reason: string
  nextAction: string
  href?: string
}

type AdminUser = {
  id: string
  name: string
  email: string
  role: string
  accessProfile: string
  invitePending: boolean
  accessSummary?: string[]
}

type SecurityEvent = {
  id: string
  action: string
  entity: string
  createdAt: string
}

const statusTone: Record<string, string> = {
  ready: "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15",
  limited: "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15",
  "action-required": "bg-rose-500/15 text-rose-300 hover:bg-rose-500/15",
  blocked: "bg-slate-500/15 text-slate-300 hover:bg-slate-500/15",
  optional: "bg-sky-500/15 text-sky-300 hover:bg-sky-500/15",
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not recorded yet"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Not recorded yet" : date.toLocaleString()
}

export function WorkspaceAdminCentre() {
  const { data: session } = useSession()
  const founderView = canViewFounderControls(session?.user?.role, session?.user?.email)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [workspace, setWorkspace] = useState<{ name: string; userCount: number; adminCount: number } | null>(null)
  const [privacySettings, setPrivacySettings] = useState<PrivacyLockSetting[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [auditEvents, setAuditEvents] = useState<SecurityEvent[]>([])
  const [setupItems, setSetupItems] = useState<SetupItem[]>([])
  const [notes, setNotes] = useState<{ offboarding?: string; sessionReset?: string }>({})
  const [saving, setSaving] = useState(false)
  const [dialogModule, setDialogModule] = useState<PrivacyLockSetting | null>(null)
  const [pinAction, setPinAction] = useState<"set" | "rotate">("set")
  const [pinForm, setPinForm] = useState({ pin: "", confirmPin: "" })

  const loadAll = async () => {
    try {
      setLoading(true)
      setError("")
      const headers = { ...getSessionHeaders(session?.user) }
      const [workspaceData, privacyData, usersData, securityData, setupData] = await Promise.all([
        requestJson<any>("/api/admin/workspace", { headers }),
        requestJson<any>("/api/admin/privacy-lock-settings", { headers }),
        requestJson<any>("/api/admin/users", { headers }),
        requestJson<any>("/api/admin/security", { headers }),
        requestJson<any>("/api/setup/readiness", { headers }),
      ])

      setWorkspace({
        name: workspaceData?.org?.name || "Workspace",
        userCount: workspaceData?.summary?.userCount || 0,
        adminCount: workspaceData?.summary?.adminCount || 0,
      })
      setPrivacySettings(Array.isArray(privacyData?.settings) ? privacyData.settings : [])
      setUsers(Array.isArray(usersData?.users) ? usersData.users : [])
      setAuditEvents(
        Array.isArray(securityData?.recentAuditEvents)
          ? securityData.recentAuditEvents.map((event: any) => ({
              id: event.id,
              action: event.action,
              entity: event.entity,
              createdAt: event.createdAt,
            }))
          : [],
      )
      setSetupItems(Array.isArray(setupData?.setupItems) ? setupData.setupItems : [])
      setNotes(privacyData?.notes || {})
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load workspace admin centre"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [session?.user?.email])

  const pendingInvites = useMemo(() => users.filter((user) => user.invitePending).length, [users])
  const financeManagers = useMemo(
    () => users.filter((user) => user.accessProfile === "FINANCE" || user.accessProfile === "ADMINISTRATION"),
    [users],
  )
  const hrManagers = useMemo(
    () => users.filter((user) => user.accessProfile === "HR" || user.accessProfile === "ADMINISTRATION"),
    [users],
  )

  const submitPinAction = async () => {
    if (!dialogModule) return
    try {
      setSaving(true)
      setError("")
      await requestJson("/api/admin/privacy-lock-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(session?.user),
        },
        body: JSON.stringify({
          module: dialogModule.module,
          action: pinAction,
          pin: pinForm.pin,
          confirmPin: pinForm.confirmPin,
        }),
      })
      setDialogModule(null)
      setPinForm({ pin: "", confirmPin: "" })
      await loadAll()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update privacy PIN"))
    } finally {
      setSaving(false)
    }
  }

  const forceLock = async (module: PrivacyModule) => {
    try {
      setSaving(true)
      setError("")
      await requestJson("/api/admin/privacy-lock-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getSessionHeaders(session?.user),
        },
        body: JSON.stringify({
          module,
          action: "force-lock",
        }),
      })
      await loadAll()
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to force-lock active sessions"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading workspace admin centre...</div>
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-muted/25">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Workspace Admin Center</Badge>
              <Badge variant="outline">{session?.user?.role || "Admin"}</Badge>
              {founderView ? <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Founder platform controls available separately</Badge> : null}
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Run your organisation admin work without leaving Civis.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                This centre is for workspace-scoped users, invites, privacy locks, access review, offboarding, and
                launch readiness. Platform founder controls remain separate.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/admin/users">
                  Open Users & Invites
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/setup">Open Setup & Launch Readiness</Link>
              </Button>
              {founderView ? (
                <Button asChild variant="outline">
                  <Link href="/admin/launch-readiness">Open Founder Launch Readiness</Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-muted-foreground">Workspace</p>
              <p className="mt-3 text-2xl font-semibold">{workspace?.name || "Workspace"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Org-scoped admin only.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-muted-foreground">Team members</p>
              <p className="mt-3 text-2xl font-semibold">{workspace?.userCount || 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">{pendingInvites} pending invite{pendingInvites === 1 ? "" : "s"}.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-muted-foreground">Admin seats</p>
              <p className="mt-3 text-2xl font-semibold">{workspace?.adminCount || 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">Review privileged access regularly.</p>
            </div>
            <div className="rounded-3xl border border-border bg-background/70 p-4">
              <p className="text-sm font-medium text-muted-foreground">Audit activity</p>
              <p className="mt-3 text-2xl font-semibold">{auditEvents.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Recent recorded admin/security events.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card id="users-and-invites">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Users & Invites
              </CardTitle>
              <CardDescription>Invite teammates, refresh signup links, review accepted users, and keep roles scoped to this organisation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-sm font-medium">Total users</p>
                  <p className="mt-2 text-2xl font-semibold">{users.length}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-sm font-medium">Pending invites</p>
                  <p className="mt-2 text-2xl font-semibold">{pendingInvites}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-sm font-medium">Workspace admins</p>
                  <p className="mt-2 text-2xl font-semibold">{workspace?.adminCount || 0}</p>
                </div>
              </div>
              <div className="space-y-3">
                {users.slice(0, 6).map((user) => (
                  <div key={user.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 p-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • {user.role} • {user.accessProfile}
                      </p>
                    </div>
                    {user.invitePending ? <Badge variant="outline">Invite pending</Badge> : <Badge className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">Active</Badge>}
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/admin/users">
                  Manage users and invites
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card id="privacy-locks">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-primary" />
                Privacy Locks
              </CardTitle>
              <CardDescription>Set, rotate, and force-lock HR and Accounting privacy PINs per organisation. PIN values are never shown again after saving.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {privacySettings.map((setting) => (
                <div key={setting.module} className="rounded-3xl border border-border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{setting.label}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {setting.module === "hr"
                          ? "Use this PIN to unlock sensitive employee and payroll records for authorised users."
                          : "Use this PIN to unlock invoice, expense, approval, and export details for authorised users."}
                      </p>
                    </div>
                    <Badge className={setting.configured ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15" : "bg-amber-500/15 text-amber-300 hover:bg-amber-500/15"}>
                      {setting.configured ? "Configured" : "Not configured"}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                    <p>Last updated: {formatDateTime(setting.updatedAt)}</p>
                    <p>Updated by: {setting.updatedBy || "Not recorded yet"}</p>
                    <p>Last rotation: {formatDateTime(setting.lastRotatedAt)}</p>
                    <p>Rotation by: {setting.lastRotatedBy || "Not recorded yet"}</p>
                    {setting.source === "legacy-env" ? (
                      <p className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-amber-700 dark:text-amber-300">
                        Legacy platform fallback detected. Move this PIN into Civis so organisation admins manage it directly.
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => {
                        setDialogModule(setting)
                        setPinAction(setting.configured ? "rotate" : "set")
                        setPinForm({ pin: "", confirmPin: "" })
                      }}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      {setting.configured ? "Rotate PIN" : "Set PIN"}
                    </Button>
                    {setting.configured ? (
                      <Button type="button" variant="outline" className="bg-transparent" onClick={() => void forceLock(setting.module)} disabled={saving}>
                        Force-lock active sessions
                      </Button>
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Changing this PIN immediately locks existing unlocked sessions again.
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="offboarding-and-access-review">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-primary" />
                Offboarding & Access Review
              </CardTitle>
              <CardDescription>Use this checklist whenever HR, finance, or other privileged staff leave.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Suspend or remove user access in Users & Invites.",
                "Reduce roles and remove module permissions that are no longer required.",
                "Rotate the HR privacy PIN if the person had HR access.",
                "Rotate the Accounting privacy PIN if the person had finance/accounting access.",
                "Force-lock active privacy sessions before sharing the new PIN.",
                "Review audit/activity and reassign owned tasks, deals, or projects where needed.",
                "Global force sign-out is not yet guaranteed by the current JWT session model, so treat it as a follow-up hardening item.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-background/70 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
              {notes.offboarding ? <p className="text-sm text-muted-foreground">{notes.offboarding}</p> : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card id="roles-and-permissions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Roles & Permissions
              </CardTitle>
              <CardDescription>Review who can manage HR, Accounting, exports, approvals, and workspace administration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-medium">Review HR access</p>
                  <p className="mt-2 text-sm text-muted-foreground">{hrManagers.length} user(s) currently mapped to HR-heavy profiles.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-medium">Review Accounting access</p>
                  <p className="mt-2 text-sm text-muted-foreground">{financeManagers.length} user(s) currently mapped to finance-heavy profiles.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-medium">Review export permissions</p>
                  <p className="mt-2 text-sm text-muted-foreground">Accounting manage access is still required before exports unlock sensitive finance data.</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="font-medium">Review approval permissions</p>
                  <p className="mt-2 text-sm text-muted-foreground">Operations and Accounting managers should be checked after every role change.</p>
                </div>
              </div>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/admin/users">
                  Review admin users and roles
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card id="security-and-sessions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Security & Sessions
              </CardTitle>
              <CardDescription>Protect privileged users and keep access reviews honest.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="font-medium">Current support</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Privacy PIN rotation and force-lock are fully server-backed. Existing module-unlock cookies become invalid immediately after a version change.
                </p>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
                {notes.sessionReset ||
                  "Global force sign-out is not fully supported in the current JWT session model. Do not treat it as a completed control yet."}
              </div>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/admin/security">
                  Open risk and access review
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card id="setup-and-launch-readiness">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Setup & Launch Readiness
              </CardTitle>
              <CardDescription>Only evidence-backed setup items should read as ready.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {setupItems.slice(0, 8).map((item) => (
                <div key={item.id} className="rounded-2xl border border-border bg-background/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                    <Badge className={statusTone[item.status] || statusTone.limited}>{item.status}</Badge>
                  </div>
                  {item.href ? (
                    <Button asChild variant="link" className="mt-3 h-auto p-0">
                      <Link href={item.href}>
                        Open item
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card id="audit-and-activity">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Audit / Activity
              </CardTitle>
              <CardDescription>Sensitive admin actions should remain traceable without exposing secrets.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditEvents.length ? (
                auditEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border bg-background/70 p-3">
                    <p className="font-medium">{event.action}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {event.entity} • {formatDateTime(event.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
                  No recent audit events are available in this workspace yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={Boolean(dialogModule)} onOpenChange={(open) => !open && setDialogModule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{pinAction === "set" ? "Set privacy PIN" : "Rotate privacy PIN"}</DialogTitle>
            <DialogDescription>
              {dialogModule?.module === "hr"
                ? "Use this PIN to unlock sensitive employee and payroll records for authorised users."
                : "Use this PIN to unlock invoice, expense, approval, and export details for authorised users."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privacy-pin">New PIN</Label>
              <Input
                id="privacy-pin"
                type="password"
                value={pinForm.pin}
                onChange={(event) => setPinForm((current) => ({ ...current, pin: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacy-pin-confirm">Confirm PIN</Label>
              <Input
                id="privacy-pin-confirm"
                type="password"
                value={pinForm.confirmPin}
                onChange={(event) => setPinForm((current) => ({ ...current, confirmPin: event.target.value }))}
              />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
              Changing this PIN immediately locks existing unlocked sessions again.
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogModule(null)} className="bg-transparent">
                Cancel
              </Button>
              <Button type="button" onClick={() => void submitPinAction()} disabled={saving}>
                {saving ? "Saving..." : pinAction === "set" ? "Save PIN" : "Rotate PIN"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type PrivacyModule = "hr" | "accounting"
