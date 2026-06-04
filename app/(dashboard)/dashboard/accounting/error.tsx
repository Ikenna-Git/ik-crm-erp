"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AccountingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Accounting route failed", error)
  }, [error])

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Accounting is temporarily unavailable</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The accounting workspace hit a client-side error while loading. Refresh once. If it keeps failing, keep using
          the rest of the app and report this screen so the bad record or widget can be isolated.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 text-sm">
        <p className="font-medium">What this means</p>
        <p className="text-muted-foreground mt-1">
          This failure is contained to the accounting route. It should not block login, onboarding, CRM, admin, or other
          dashboard modules.
        </p>
      </div>
      <Button onClick={reset}>Try loading accounting again</Button>
    </div>
  )
}
