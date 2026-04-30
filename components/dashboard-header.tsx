"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
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
        <NotificationCenter />
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
