"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addNotification } from "@/lib/notifications"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_PREFERENCES,
  DEFAULT_PROFILE,
  getNotificationSettings,
  getUserPreferences,
  getUserProfile,
  saveNotificationSettings,
  saveUserPreferences,
  saveUserProfile,
} from "@/lib/user-settings"

export default function ProfilePage() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE)
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES)
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS)

  useEffect(() => {
    if (typeof window === "undefined") return
    setProfile(getUserProfile())
    setPreferences(getUserPreferences())
    setNotificationSettings(getNotificationSettings())
  }, [])

  const pushChangeNotification = (title: string, description: string) => {
    addNotification({ title, description, source: "Profile", channel: "in-app" })
    if (notificationSettings.email) {
      const target = profile.email || "your inbox"
      addNotification({
        title: "Email notification sent",
        description: `A copy was sent to ${target}.`,
        source: "Email",
        channel: "email",
      })
    }
  }

  const handleProfileSave = () => {
    const next = saveUserProfile(profile)
    setProfile(next)
    pushChangeNotification("Profile updated", "Saved your latest profile details.")
  }

  const handlePreferencesSave = () => {
    const nextPreferences = saveUserPreferences(preferences)
    const nextNotifications = saveNotificationSettings(notificationSettings)
    setPreferences(nextPreferences)
    setNotificationSettings(nextNotifications)
    pushChangeNotification("Preferences updated", `Theme set to ${nextPreferences.theme}.`)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View and update your personal information.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>Keep your details up to date.</CardDescription>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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
                    {["Africa/Lagos", "UTC", "Europe/London", "America/New_York"].map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-fit" onClick={handleProfileSave}>
              Save changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Quick toggles just for you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-muted-foreground">Product updates and reminders</p>
              </div>
              <Switch
                checked={notificationSettings.email}
                onCheckedChange={(v) => setNotificationSettings({ ...notificationSettings, email: v })}
              />
            </div>
            <Button className="w-fit" onClick={handlePreferencesSave}>
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
