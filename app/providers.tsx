"use client"

import { SessionProvider } from "next-auth/react"
import { ClientErrorMonitor } from "@/components/client-error-monitor"
import { PWAProvider } from "@/components/pwa-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PWAProvider />
      <ClientErrorMonitor />
      {children}
    </SessionProvider>
  )
}
