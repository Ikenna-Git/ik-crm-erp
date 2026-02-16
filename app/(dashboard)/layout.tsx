"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { OfflineBanner } from "@/components/offline-banner"
import { AiAssistPopover } from "@/components/ai-assist-popover"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const loading = status === "loading"

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [router, status])

  useEffect(() => {
    if (!session?.user) return
    const payload = {
      name: session.user.name || "",
      email: session.user.email || "",
      role: session.user.role || "user",
    }
    localStorage.setItem("user", JSON.stringify(payload))
  }, [session])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 rounded-lg bg-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <OfflineBanner />
        <DashboardHeader />
        <main className="flex-1 overflow-auto">{children}</main>
        <AiAssistPopover />
      </div>
    </div>
  )
}
