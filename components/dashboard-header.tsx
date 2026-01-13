"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThemeToggle } from "@/components/theme-toggle"
import { UnifiedSearch } from "@/components/unified-search"
import {
  clearNotifications,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsEventName,
  type NotificationItem,
} from "@/lib/notifications"
import { userUpdatedEventName } from "@/lib/user-settings"

export function DashboardHeader() {
  const [userName, setUserName] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [online, setOnline] = useState(true)

  const unreadCount = notifications.filter((item) => !item.read).length

  const formatTimestamp = (value: string) => {
    const date = new Date(value)
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  useEffect(() => {
    const loadUser = () => {
      try {
        const raw = localStorage.getItem("user")
        if (!raw) {
          setUserName("User")
          return
        }
        const parsed = JSON.parse(raw)
        const fallback = parsed?.email ? parsed.email.split("@")[0] : "User"
        setUserName(parsed?.name || fallback)
      } catch {
        setUserName("User")
      }
    }
    loadUser()
    window.addEventListener(userUpdatedEventName, loadUser)
    window.addEventListener("storage", loadUser)
    return () => {
      window.removeEventListener(userUpdatedEventName, loadUser)
      window.removeEventListener("storage", loadUser)
    }
  }, [])

  useEffect(() => {
    const refreshNotifications = async () => {
      const items = await getNotifications()
      setNotifications(items)
    }
    refreshNotifications()
    const handleUpdate = () => {
      refreshNotifications()
    }
    window.addEventListener(notificationsEventName, handleUpdate)
    window.addEventListener("storage", handleUpdate)
    return () => {
      window.removeEventListener(notificationsEventName, handleUpdate)
      window.removeEventListener("storage", handleUpdate)
    }
  }, [])

  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setTimestamp(
        `${now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })} • ${now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`,
      )
    }
    updateClock()
    const timer = window.setInterval(updateClock, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine)
    updateStatus()
    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)
    return () => {
      window.removeEventListener("online", updateStatus)
      window.removeEventListener("offline", updateStatus)
    }
  }, [])

  return (
    <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 max-w-xl">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Civis Pulse</p>
            <p className="text-xs text-muted-foreground">{timestamp || "Loading time..."}</p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              Sync: {online ? "Online" : "Offline"}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Mode: Live</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <UnifiedSearch />
        <ThemeToggle />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-destructive text-white text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-start justify-between px-4 py-3 border-b border-border">
              <div>
                <p className="font-semibold">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {unreadCount ? `${unreadCount} unread updates` : "All caught up"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const next = await markAllNotificationsRead()
                    setNotifications(next)
                  }}
                >
                  Mark all read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const next = await clearNotifications()
                    setNotifications(next)
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length ? (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition ${
                      item.read ? "bg-background" : "bg-primary/5"
                    }`}
                    onClick={async () => {
                      const next = await markNotificationRead(item.id)
                      setNotifications(next)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.read ? "bg-muted" : "bg-primary"}`} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{item.title}</p>
                          <span className="text-xs text-muted-foreground">{formatTimestamp(item.createdAt)}</span>
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        <div className="flex items-center gap-2">
                          {item.source && (
                            <Badge variant="outline" className="bg-transparent">
                              {item.source}
                            </Badge>
                          )}
                          <Badge variant={item.channel === "email" ? "secondary" : "outline"} className="bg-transparent">
                            {item.channel === "email" ? "Email" : "In-app"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-sm text-muted-foreground">No updates yet.</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="sm" className="flex items-center gap-2" asChild>
          <Link href="/dashboard/profile">
            <User className="w-5 h-5" />
            <span className="text-sm">{userName}</span>
          </Link>
        </Button>
      </div>
    </header>
  )
}
