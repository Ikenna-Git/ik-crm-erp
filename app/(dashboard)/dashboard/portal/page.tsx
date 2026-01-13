"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSessionHeaders } from "@/lib/user-settings"
import { Copy, PlusCircle } from "lucide-react"

type PortalItem = {
  id: string
  name: string
  contactName?: string
  contactEmail?: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
  accessCode: string
  summary?: string
  updatedAt: string
}

const portalSeed: PortalItem[] = [
  {
    id: "portal-1",
    name: "Northwind Trading",
    contactName: "Adaeze Okafor",
    contactEmail: "adaeze@northwind.com",
    status: "ACTIVE",
    accessCode: "northwind",
    summary: "Weekly rollout updates and invoice access.",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "portal-2",
    name: "Globex Corp",
    contactName: "Emeka Umeh",
    contactEmail: "emeka@globex.com",
    status: "PAUSED",
    accessCode: "globex",
    summary: "Implementation paused pending contract review.",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

const statusStyles: Record<PortalItem["status"], string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  PAUSED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  ARCHIVED: "bg-slate-200 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200",
}

export default function ClientPortalPage() {
  const [portals, setPortals] = useState<PortalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openDialog, setOpenDialog] = useState(false)
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    summary: "",
  })

  const loadPortals = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await fetch("/api/portal", { headers: { ...getSessionHeaders() } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to load portals")
      const loaded = Array.isArray(data.portals) ? data.portals : []
      setPortals(loaded.length ? loaded : portalSeed)
    } catch (err: any) {
      setError(err?.message || "Failed to load portals")
      setPortals(portalSeed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPortals()
  }, [])

  const handleCreate = async () => {
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create portal")
      setPortals((prev) => [data.portal, ...prev])
      setForm({ name: "", contactName: "", contactEmail: "", summary: "" })
      setOpenDialog(false)
    } catch (err: any) {
      setError(err?.message || "Failed to create portal")
    }
  }

  const handleStatusUpdate = async (id: string, status: PortalItem["status"]) => {
    try {
      const res = await fetch("/api/portal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update portal")
      setPortals((prev) => prev.map((item) => (item.id === id ? data.portal : item)))
    } catch (err: any) {
      setError(err?.message || "Failed to update portal")
    }
  }

  const copyLink = async (code: string) => {
    const base = typeof window === "undefined" ? "" : window.location.origin
    const link = `${base}/portal/${code}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      window.prompt("Copy portal link:", link)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Client Portal</h1>
          <p className="text-muted-foreground mt-1">Give clients a secure view of deliverables and updates.</p>
          {loading && <p className="text-xs text-muted-foreground">Loading portals...</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              New Portal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create client portal</DialogTitle>
              <DialogDescription>Share updates, milestones, and documents with external clients.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portal-name">Client name</Label>
                <Input
                  id="portal-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Northwind Trading"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Contact name</Label>
                  <Input
                    id="contact-name"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Adaeze Okafor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="client@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Input
                  id="summary"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Shared status update for Q1 rollout."
                />
              </div>
              <Button onClick={handleCreate} className="w-full">
                Create portal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {portals.map((portal) => (
          <Card key={portal.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>{portal.name}</CardTitle>
                  <CardDescription>
                    {portal.contactName || "No contact"} • {portal.contactEmail || "No email"}
                  </CardDescription>
                </div>
                <Badge className={statusStyles[portal.status]}>{portal.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{portal.summary || "No summary yet."}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyLink(portal.accessCode)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link
                </Button>
                <Select
                  value={portal.status}
                  onValueChange={(value) => handleStatusUpdate(portal.id, value as PortalItem["status"])}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(portal.updatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
