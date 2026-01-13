"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { addNotification } from "@/lib/notifications"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  applyThemePreference,
  getSessionHeaders,
  syncLocalUser,
} from "@/lib/user-settings"

const timezones = ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"]
const currencies = ["NGN", "USD", "EUR", "GBP"]
const industries = ["Technology", "Finance", "Retail", "Manufacturing", "Healthcare"]
const roles = ["user", "admin", "super_admin"]

export default function SettingsPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState(DEFAULT_PROFILE)

  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)

  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATION_SETTINGS)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [security, setSecurity] = useState({
    twoFactor: true,
    loginAlerts: true,
    sessionTimeout: "30",
  })

  const [org, setOrg] = useState({
    name: "Civis HQ",
    industry: "Technology",
    currency: "NGN",
    fiscalYear: "January",
    inviteEmail: "",
    inviteRole: "user",
  })

  const [billing] = useState({
    plan: "Pro",
    seats: { used: 8, total: 12 },
    renewal: "2025-06-01",
    amount: "₦250,000 / mo",
  })

  const [showPasswords, setShowPasswords] = useState(false)

  const storageKeys = {
    security: "civis_settings_security",
    org: "civis_settings_org",
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const load = (key: string, setter: (v: any) => void) => {
      try {
        const raw = localStorage.getItem(key)
        if (raw) setter(JSON.parse(raw))
      } catch (err) {
        console.warn("Failed to load settings", err)
      }
    }
    const loadUserSettings = async () => {
      try {
        setLoading(true)
        setError("")
        const res = await fetch("/api/user/settings", {
          headers: { "Content-Type": "application/json", ...getSessionHeaders(session?.user) },
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load settings")
        setProfile(data.profile || DEFAULT_PROFILE)
        const loadedPreferences = data.preferences || DEFAULT_PREFERENCES
        setPreferences(loadedPreferences)
        setNotifications(data.notifications || DEFAULT_NOTIFICATION_SETTINGS)
        applyThemePreference(loadedPreferences.theme)
      } catch (err: any) {
        setError(err?.message || "Failed to load settings")
      } finally {
        setLoading(false)
      }
    }
    loadUserSettings()
    load(storageKeys.security, setSecurity)
    load(storageKeys.org, setOrg)
  }, [])

  const persist = (key: string, value: any) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (err) {
      console.warn("Failed to save settings", err)
    }
  }

  const pushChangeNotification = async (title: string, description: string, emailOptIn = notifications.email) => {
    await addNotification({
      title,
      description,
      source: "Settings",
      channel: emailOptIn ? "email" : "in-app",
      deliverEmail: emailOptIn,
    })
  }

  const handleProfileSave = () => {
    const update = async () => {
      try {
        setError("")
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getSessionHeaders(session?.user) },
          body: JSON.stringify({ profile }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to update profile")
        const nextProfile = data.profile || profile
        setProfile(nextProfile)
        syncLocalUser(nextProfile)
        await pushChangeNotification("Profile updated", "Saved your profile details.")
      } catch (err: any) {
        setError(err?.message || "Failed to update profile")
      }
    }
    update()
  }

  const handlePreferencesSave = () => {
    const update = async () => {
      try {
        setError("")
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getSessionHeaders(session?.user) },
          body: JSON.stringify({ preferences }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to update preferences")
        const nextPreferences = data.preferences || preferences
        setPreferences(nextPreferences)
        applyThemePreference(nextPreferences.theme)
        await pushChangeNotification("Preferences updated", `Theme set to ${nextPreferences.theme}.`)
      } catch (err: any) {
        setError(err?.message || "Failed to update preferences")
      }
    }
    update()
  }

  const handleNotificationsSave = () => {
    const update = async () => {
      try {
        setError("")
        const res = await fetch("/api/user/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getSessionHeaders(session?.user) },
          body: JSON.stringify({ notifications }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to update notifications")
        const nextNotifications = data.notifications || notifications
        setNotifications(nextNotifications)
        await pushChangeNotification("Notifications updated", "Notification channels updated.", nextNotifications.email)
      } catch (err: any) {
        setError(err?.message || "Failed to update notifications")
      }
    }
    update()
  }

  const handleSecuritySave = () => {
    persist(storageKeys.security, security)
    pushChangeNotification("Security updated", "Security settings saved.")
  }

  const handleOrgSave = () => {
    persist(storageKeys.org, org)
    pushChangeNotification("Organization updated", "Organization settings saved.")
  }

  const handleInvite = () => {
    if (!org.inviteEmail) {
      pushChangeNotification("Invite needed", "Add an email address to send an invite.")
      return
    }
    pushChangeNotification("Invite sent", `Invitation sent to ${org.inviteEmail}.`)
  }

  const handlePasswordChange = () => {
    pushChangeNotification("Password update requested", "Password change submitted.")
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, preferences, security, notifications, organization, and billing.
        </p>
        {loading && <p className="text-xs text-muted-foreground">Loading settings...</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="locale">Locale</Label>
                  <Input
                    id="locale"
                    value={profile.locale}
                    onChange={(e) => setProfile({ ...profile, locale: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-fit" onClick={handleProfileSave}>
                Save profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Protect your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-factor authentication</p>
                  <p className="text-sm text-muted-foreground">Use an authenticator app for sign in.</p>
                </div>
                <Switch
                  checked={security.twoFactor}
                  onCheckedChange={(v) => setSecurity({ ...security, twoFactor: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login alerts</p>
                  <p className="text-sm text-muted-foreground">Email me when a new device signs in.</p>
                </div>
                <Switch
                  checked={security.loginAlerts}
                  onCheckedChange={(v) => setSecurity({ ...security, loginAlerts: v })}
                />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="session">Session timeout (minutes)</Label>
                  <Input
                    id="session"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  />
                </div>
                <div className="self-end">
                  <Button className="w-full" onClick={handleSecuritySave}>
                    Update security
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-4 md:items-end">
                <div className="md:col-span-3 grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type={showPasswords ? "text" : "password"} placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type={showPasswords ? "text" : "password"} placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="confirm">Confirm new password</Label>
                    <Input id="confirm" type={showPasswords ? "text" : "password"} placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showPasswords}
                    onCheckedChange={setShowPasswords}
                    aria-label="Toggle password visibility"
                  />
                  <span className="text-sm text-muted-foreground">Show passwords</span>
                </div>
              </div>
              <Button className="w-fit" variant="secondary" onClick={handlePasswordChange}>
                Change password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, theme: value as "light" | "dark" | "system" })
                    }
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
                <div>
                  <Label>Density</Label>
                  <Select
                    value={preferences.density}
                    onValueChange={(value) =>
                      setPreferences({ ...preferences, density: value as "comfortable" | "compact" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="compact">Compact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default landing tab</Label>
                  <Select
                    value={preferences.landing}
                    onValueChange={(value) => setPreferences({ ...preferences, landing: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="accounting">Accounting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={preferences.currency}
                    onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date format</Label>
                  <Input
                    value={preferences.dateFormat}
                    onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-fit" onClick={handlePreferencesSave}>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "email", title: "Email copies", desc: "Send email copies of important updates." },
                { key: "product", title: "Product updates", desc: "New features, releases, and roadmap." },
                { key: "security", title: "Security alerts", desc: "Login alerts, suspicious activity." },
                { key: "reminders", title: "Reminders", desc: "Tasks, invoices, and approval reminders." },
                { key: "marketing", title: "Tips & marketing", desc: "Educational content and offers." },
                { key: "sms", title: "SMS alerts", desc: "Mobile notifications for critical events." },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(v) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: v }))
                    }
                  />
                </div>
              ))}
              <Button className="w-fit" onClick={handleNotificationsSave}>
                Update notifications
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Workspace details and team access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="org-name">Organization name</Label>
                  <Input
                    id="org-name"
                    value={org.name}
                    onChange={(e) => setOrg({ ...org, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={org.industry}
                    onValueChange={(value) => setOrg({ ...org, industry: value })}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="org-currency">Base currency</Label>
                  <Select
                    value={org.currency}
                    onValueChange={(value) => setOrg({ ...org, currency: value })}
                  >
                    <SelectTrigger id="org-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fiscal">Fiscal year start</Label>
                  <Input
                    id="fiscal"
                    value={org.fiscalYear}
                    onChange={(e) => setOrg({ ...org, fiscalYear: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-fit" onClick={handleOrgSave}>
                Save organization
              </Button>

              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Invite team</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    placeholder="email@example.com"
                    value={org.inviteEmail}
                    onChange={(e) => setOrg({ ...org, inviteEmail: e.target.value })}
                  />
                  <Select
                    value={org.inviteRole}
                    onValueChange={(value) => setOrg({ ...org, inviteRole: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="w-full" onClick={handleInvite}>
                    Send invite
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Plan, seats, and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <p className="text-xl font-bold">
                    {billing.plan} <span className="text-sm text-muted-foreground">({billing.amount})</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Renews on {billing.renewal}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Seats</p>
                  <p className="text-xl font-bold">
                    {billing.seats.used} / {billing.seats.total} used
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="bg-transparent">
                      Manage seats
                    </Button>
                    <Button>Upgrade plan</Button>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Invoices</p>
                <div className="border border-border rounded-lg divide-y divide-border">
                  {["2025-01", "2024-12", "2024-11"].map((invoice) => (
                    <div key={invoice} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium">Invoice {invoice}</p>
                        <p className="text-xs text-muted-foreground">Paid • ₦250,000</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
