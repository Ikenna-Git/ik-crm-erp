"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  const [userName, setUserName] = useState("")
  const [timestamp, setTimestamp] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || userData.email.split("@")[0])
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
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Sync: Local</span>
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground">Mode: Live</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="sm">
          <Bell className="w-5 h-5" />
        </Button>
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
