"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  if (online) return null

  return (
    <div className="bg-yellow-500/15 border-b border-yellow-500/30 text-yellow-900 dark:text-yellow-200 px-6 py-2 text-sm flex items-center gap-2">
      <WifiOff className="w-4 h-4" />
      You are offline. Showing cached data until connection is restored.
    </div>
  )
}
