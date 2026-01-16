"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getSessionHeaders } from "@/lib/user-settings"
import { Copy, PlusCircle, UploadCloud } from "lucide-react"

type PortalUpdate = {
  id: string
  title: string
  message?: string
  status?: string
  createdAt: string
}

type PortalDocument = {
  id: string
  title: string
  url: string
  fileType?: string
  bytes?: number
  createdAt: string
}

type PortalItem = {
  id: string
  name: string
  contactName?: string
  contactEmail?: string
  status: "ACTIVE" | "PAUSED" | "ARCHIVED"
  accessCode: string
  summary?: string
  updatedAt: string
  updates?: PortalUpdate[]
  documents?: PortalDocument[]
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
    updates: [
      {
        id: "up-1",
        title: "Kickoff completed",
        message: "Onboarding finished and access granted to the client.",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
      },
    ],
    documents: [
      {
        id: "doc-1",
        title: "Implementation plan",
        url: "https://example.com/plan.pdf",
        fileType: "pdf",
        createdAt: new Date().toISOString(),
      },
    ],
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
    updates: [
      {
        id: "up-2",
        title: "Contract review",
        message: "Waiting on procurement sign-off.",
        status: "PAUSED",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ],
    documents: [],
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
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false)
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
  const [activePortal, setActivePortal] = useState<PortalItem | null>(null)
  const [form, setForm] = useState({
    name: "",
    contactName: "",
    contactEmail: "",
    summary: "",
  })
  const [updateForm, setUpdateForm] = useState({
    title: "",
    message: "",
    status: "ACTIVE",
  })
  const [documentForm, setDocumentForm] = useState({
    title: "",
    url: "",
    fileType: "document",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [uploading, setUploading] = useState(false)

  const MAX_FILE_SIZE = 5 * 1024 * 1024

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

  useEffect(() => {
    if (!updateDialogOpen) {
      setUpdateForm({ title: "", message: "", status: "ACTIVE" })
    }
    if (!documentDialogOpen) {
      setDocumentForm({ title: "", url: "", fileType: "document" })
      setSelectedFile(null)
      setUploadError("")
    }
  }, [updateDialogOpen, documentDialogOpen])

  const openUpdateDialogFor = (portal: PortalItem) => {
    setActivePortal(portal)
    setUpdateForm({ title: "", message: "", status: portal.status })
    setUpdateDialogOpen(true)
  }

  const openDocumentDialogFor = (portal: PortalItem) => {
    setActivePortal(portal)
    setDocumentForm({ title: "", url: "", fileType: "document" })
    setSelectedFile(null)
    setUploadError("")
    setDocumentDialogOpen(true)
  }

  const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)
    const res = await fetch("/api/uploads/cloudinary", {
      method: "POST",
      headers: { ...getSessionHeaders() },
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error || "Upload failed")
    return data
  }

  const handleAddUpdate = async () => {
    if (!activePortal) return
    try {
      const res = await fetch("/api/portal/updates", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          portalId: activePortal.id,
          title: updateForm.title,
          message: updateForm.message,
          status: updateForm.status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to add update")
      setPortals((prev) =>
        prev.map((portal) =>
          portal.id === activePortal.id
            ? {
                ...portal,
                updates: [data.update, ...(portal.updates || [])],
                status: updateForm.status as PortalItem["status"],
                updatedAt: new Date().toISOString(),
              }
            : portal,
        ),
      )
      setUpdateDialogOpen(false)
    } catch (err: any) {
      setError(err?.message || "Failed to add update")
    }
  }

  const handleAddDocument = async () => {
    if (!activePortal) return
    try {
      setUploading(true)
      setUploadError("")
      let url = documentForm.url.trim()
      let bytes = 0
      let fileType = documentForm.fileType

      if (selectedFile) {
        if (selectedFile.size > MAX_FILE_SIZE) {
          setUploadError("File too large. Please upload a file under 5 MB.")
          return
        }
        const uploaded = await uploadToCloudinary(selectedFile, "civis/portal")
        url = uploaded.url
        bytes = uploaded.bytes || 0
        fileType = uploaded.resourceType || documentForm.fileType
      }

      if (!url) {
        setUploadError("Upload a file or add a URL.")
        return
      }

      const res = await fetch("/api/portal/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          portalId: activePortal.id,
          title: documentForm.title || "Shared document",
          url,
          fileType,
          bytes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to add document")
      setPortals((prev) =>
        prev.map((portal) =>
          portal.id === activePortal.id
            ? {
                ...portal,
                documents: [data.document, ...(portal.documents || [])],
                updatedAt: new Date().toISOString(),
              }
            : portal,
        ),
      )
      setDocumentDialogOpen(false)
    } catch (err: any) {
      setUploadError(err?.message || "Failed to add document")
    } finally {
      setUploading(false)
    }
  }

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
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <p className="text-xs uppercase text-muted-foreground mb-2">Latest update</p>
                {portal.updates && portal.updates.length ? (
                  <div>
                    <p className="text-sm font-medium">{portal.updates[0].title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{portal.updates[0].message || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(portal.updates[0].createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No updates yet.</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase text-muted-foreground">Shared documents</p>
                {portal.documents && portal.documents.length ? (
                  portal.documents.slice(0, 2).map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs hover:bg-muted/40 transition"
                    >
                      <span className="font-medium">{doc.title}</span>
                      <span className="text-muted-foreground">{doc.fileType || "file"}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No documents shared yet.</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => copyLink(portal.accessCode)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy link
                </Button>
                <Button variant="outline" size="sm" onClick={() => openUpdateDialogFor(portal)}>
                  Add update
                </Button>
                <Button variant="outline" size="sm" onClick={() => openDocumentDialogFor(portal)}>
                  Share doc
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

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add status update</DialogTitle>
            <DialogDescription>
              {activePortal ? `Post an update for ${activePortal.name}.` : "Post a new portal update."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Update title</Label>
              <Input
                value={updateForm.title}
                onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
                placeholder="Deployment milestone completed"
              />
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                value={updateForm.message}
                onChange={(e) => setUpdateForm({ ...updateForm, message: e.target.value })}
                placeholder="Share what changed, next steps, and timing."
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={updateForm.status}
                onValueChange={(value) => setUpdateForm({ ...updateForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddUpdate} disabled={!updateForm.title.trim()}>
              Publish update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share a document</DialogTitle>
            <DialogDescription>
              Upload a file or add a link for {activePortal ? activePortal.name : "this portal"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Document title</Label>
              <Input
                value={documentForm.title}
                onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}
                placeholder="Implementation plan"
              />
            </div>
            <div className="space-y-2">
              <Label>Upload file</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Max file size 5 MB. Supports PDFs, images, or videos.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Or paste a URL</Label>
              <Input
                value={documentForm.url}
                onChange={(e) => setDocumentForm({ ...documentForm, url: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
            {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
            <Button onClick={handleAddDocument} disabled={uploading}>
              <UploadCloud className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Share document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
