"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DashboardHeader() {
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      setUserName(userData.name || userData.email.split("@")[0])
    }
  }, [])

  return (
    <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
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
