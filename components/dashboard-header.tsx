"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { User, Sparkles } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { UnifiedSearch } from "@/components/unified-search"
import { userUpdatedEventName } from "@/lib/user-settings"
import { useWorkspaceContext } from "@/components/workspace/use-workspace-context"

export function DashboardHeader() {
  const { data: session } = useSession()
  const { data: workspace } = useWorkspaceContext()
  const [userName, setUserName] = useState("")
  const [timestamp, setTimestamp] = useState("")
  const [online, setOnline] = useState(true)

  const formatTimestamp = (value: string) => {
    const date = new Date(value)
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  useEffect(() => {
    const setFromUser = (user?: { name?: string | null; email?: string | null }) => {
      const fallback = user?.email ? user.email.split("@")[0] : "User"
      setUserName(user?.name || fallback)
    }

    setFromUser(session?.user)

    const handleUserUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ name?: string; email?: string }>).detail
      setFromUser(detail)
    }

    window.addEventListener(userUpdatedEventName, handleUserUpdate)
    return () => {
      window.removeEventListener(userUpdatedEventName, handleUserUpdate)
    }
  }, [session?.user])

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
    <header className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-6 py-4 backdrop-blur-xl">
      <div className="flex-1">
        <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-gradient-to-r from-background via-background to-muted/40 px-4 py-3 max-w-2xl shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Civis Pulse</p>
            <p className="text-xs text-muted-foreground">{timestamp || "Loading time..."}</p>
          </div>
          <div className="ml-auto hidden md:flex items-center gap-2 text-xs">
            <span className="rounded-full border border-white/10 bg-card/80 px-2.5 py-1 text-muted-foreground">
              Sync: {online ? "Online" : "Offline"}
            </span>
            <span className="rounded-full border border-white/10 bg-card/80 px-2.5 py-1 text-muted-foreground">
              Mode: {workspace?.launch.modeLabel || "Loading..."}
            </span>
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
