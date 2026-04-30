"use client"

import { SessionProvider } from "next-auth/react"
import { PWAProvider } from "@/components/pwa-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PWAProvider />
      {children}
    </SessionProvider>
  )
}
