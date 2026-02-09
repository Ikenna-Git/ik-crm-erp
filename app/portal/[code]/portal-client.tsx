"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type PortalUpdate = {
  id: string
  title: string
  message?: string | null
  status?: string | null
  createdAt: string
}

type PortalDocument = {
  id: string
  title: string
  url: string
  fileType?: string | null
  createdAt: string
}

type PortalData = {
  id: string
  name: string
  status: string
  summary?: string | null
  contactName?: string | null
  contactEmail?: string | null
  accessCode: string
  updatedAt: string
  updates: PortalUpdate[]
  documents: PortalDocument[]
}

const approvalStyles: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
}

export default function PortalClient({ portal }: { portal: PortalData }) {
  const [updates, setUpdates] = useState<PortalUpdate[]>(portal.updates)
  const [decisionBusy, setDecisionBusy] = useState("")
  const [decisionError, setDecisionError] = useState("")

  const normalizedUpdates = useMemo(
    () =>
      updates.map((update) => ({
        ...update,
        status:
          update.status && ["PENDING", "APPROVED", "REJECTED"].includes(update.status.toUpperCase())
            ? update.status.toUpperCase()
            : "PENDING",
      })),
    [updates],
  )

  const handleDecision = async (updateId: string, decision: "APPROVED" | "REJECTED") => {
    setDecisionBusy(updateId)
    setDecisionError("")
    const previous = updates
    setUpdates((prev) =>
      prev.map((update) => (update.id === updateId ? { ...update, status: decision } : update)),
    )
    try {
      const res = await fetch(`/api/portal/${portal.accessCode}/approvals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, decision }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503) {
        setDecisionError("Approvals are in demo mode until the database is configured.")
        return
      }
      if (!res.ok) throw new Error(data?.error || "Failed to update approval")
      setUpdates((prev) =>
        prev.map((update) => (update.id === updateId ? { ...update, status: data.update.status } : update)),
      )
    } catch (err: any) {
      setUpdates(previous)
      setDecisionError(err?.message || "Failed to update approval.")
    } finally {
      setDecisionBusy("")
    }
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Civis Client Portal</p>
          <h1 className="text-3xl font-bold">{portal.name}</h1>
          <p className="text-muted-foreground">
            Status: <span className="font-semibold">{portal.status}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Latest summary</h2>
          <p className="text-sm text-muted-foreground">
            {portal.summary || "No summary posted yet. Check back soon for updates."}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(portal.updatedAt).toLocaleDateString()} • Contact {portal.contactName || "your Civis team"}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Updates timeline</h2>
          {decisionError ? <p className="text-xs text-destructive">{decisionError}</p> : null}
          {normalizedUpdates.length ? (
            <div className="space-y-4">
              {normalizedUpdates.map((update) => (
                <div key={update.id} className="border-b border-border pb-4 last:border-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{update.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {update.message ? <p className="text-sm text-muted-foreground">{update.message}</p> : null}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className={approvalStyles[update.status || "PENDING"] || "bg-muted"}>
                      {update.status || "PENDING"}
                    </Badge>
                    {update.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={decisionBusy === update.id}
                          onClick={() => handleDecision(update.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={decisionBusy === update.id}
                          onClick={() => handleDecision(update.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No updates posted yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Shared documents</h2>
          {portal.documents.length ? (
            <div className="space-y-2">
              {portal.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/50 transition"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.fileType || "file"} • {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents shared yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
