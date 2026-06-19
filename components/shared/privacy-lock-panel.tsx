"use client"

import { useState } from "react"
import { AlertTriangle, LockKeyhole, ShieldCheck, UnlockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type PrivacyLockPanelProps = {
  title: string
  inputLabel: string
  unlockButtonLabel: string
  lockAgainButtonLabel: string
  unlocked: boolean
  canUnlock: boolean
  loading?: boolean
  configured?: boolean
  error?: string
  helperText: string
  statusMessage?: string
  unlockedDescription?: string
  cannotUnlockMessage?: string
  notConfiguredMessage?: string
  loadingMessage?: string
  onUnlock: (pin: string) => Promise<void> | void
  onLockAgain: () => Promise<void> | void
}

export function PrivacyLockPanel({
  title,
  inputLabel,
  unlockButtonLabel,
  lockAgainButtonLabel,
  unlocked,
  canUnlock,
  loading = false,
  configured = true,
  error,
  helperText,
  statusMessage,
  unlockedDescription,
  cannotUnlockMessage,
  notConfiguredMessage,
  loadingMessage = "Checking privacy state...",
  onUnlock,
  onLockAgain,
}: PrivacyLockPanelProps) {
  const [pin, setPin] = useState("")

  const handleUnlock = async () => {
    if (!pin.trim() || loading) return
    await onUnlock(pin)
    setPin("")
  }

  return (
    <Card className="border-border/70 bg-gradient-to-br from-card via-card to-muted/30">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {unlocked ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : <LockKeyhole className="h-5 w-5 text-primary" />}
            {title}
          </CardTitle>
          <CardDescription className="mt-1">{helperText}</CardDescription>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            unlocked ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          }`}
        >
          {unlocked ? "Unlocked for this session" : "Privacy locked"}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-border bg-muted/10 p-4 text-sm text-muted-foreground">{loadingMessage}</div>
        ) : null}

        {!configured ? (
          <div className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-700 dark:text-amber-300">
            {notConfiguredMessage || "This PIN is not configured yet."}
          </div>
        ) : null}

        {unlocked ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{statusMessage || "Unlocked for this session."}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {unlockedDescription || "Role permissions still apply. Lock again when you finish reviewing this module."}
              </p>
            </div>
            <Button variant="outline" className="bg-transparent" onClick={() => void onLockAgain()} disabled={loading}>
              {lockAgainButtonLabel}
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 rounded-2xl border border-border bg-background/70 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">{inputLabel}</label>
              <Input
                type="password"
                autoComplete="off"
                inputMode="numeric"
                value={pin}
                onChange={(event) => setPin(event.target.value)}
                placeholder={canUnlock ? inputLabel : cannotUnlockMessage || "Your role cannot unlock this privacy lock."}
                disabled={!canUnlock || !configured || loading}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    void handleUnlock()
                  }
                }}
              />
            </div>
            <Button onClick={() => void handleUnlock()} disabled={!canUnlock || !configured || !pin.trim() || loading}>
              <UnlockKeyhole className="mr-2 h-4 w-4" />
              {loading ? "Checking..." : unlockButtonLabel}
            </Button>
          </div>
        )}

        {!canUnlock && configured && !loading ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
            {cannotUnlockMessage || "Your role cannot unlock this privacy lock."}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
