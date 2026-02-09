"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Trash2, Share2, Eye, Plus, Edit, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemTitle, ItemDescription, ItemFooter } from "@/components/ui/item"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSessionHeaders } from "@/lib/user-settings"

type GalleryItem = {
  id: string
  title: string
  description?: string
  url: string
  size?: number
  uploadedDate: string
  mediaType: "image" | "video" | "other"
}

const galleryTitles = [
  "Team Meeting",
  "Product Launch",
  "Office Workspace",
  "Dashboard Interface",
  "Team Collaboration",
  "Conference Presentation",
  "Product Walkthrough",
  "Client Workshop",
]

const galleryDescriptions = [
  "Q4 Planning Session",
  "Civis ERP Platform Launch Event",
  "New Office Layout Design",
  "Civis Dashboard UI Preview",
  "Cross-functional Team Workshop",
  "ERP Solutions Presentation",
  "Short overview demo for the marketing site",
  "Implementation strategy review",
]

const galleryUrls = [
  "/team-meeting-office.png",
  "/product-launch-event.png",
  "/modern-office.png",
  "/dashboard-analytics-interface.png",
  "/team-collaboration.png",
  "/business-conference-presentation.jpg",
  "/getting-started-dashboard.jpg",
]

const buildMockGallery = (count: number): GalleryItem[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `GAL-${(idx + 1).toString().padStart(3, "0")}`,
    title: galleryTitles[idx % galleryTitles.length],
    description: galleryDescriptions[idx % galleryDescriptions.length],
    url: galleryUrls[idx % galleryUrls.length],
    size: Math.round((1.5 + (idx % 5) * 0.4) * 1024 * 1024),
    uploadedDate: new Date(2025, (idx % 10) + 1, (idx % 27) + 1).toISOString(),
    mediaType: idx % 6 === 0 ? "video" : "image",
  }))

const mockImages: GalleryItem[] = buildMockGallery(70)

const formatFileSize = (bytes?: number | null) => {
  if (bytes === null || bytes === undefined) return "—"
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

const toMediaType = (value?: string) => {
  if (!value) return "image"
  if (value === "video" || value === "other" || value === "image") return value
  return "image"
}

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>(mockImages)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sharedImage, setSharedImage] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    size: "",
    mediaType: "image" as GalleryItem["mediaType"],
  })

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("")
      return
    }
    const preview = URL.createObjectURL(selectedFile)
    setPreviewUrl(preview)
    return () => URL.revokeObjectURL(preview)
  }, [selectedFile])

  const parseJsonSafe = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`)
    }
  }

  const mapItem = (item: any): GalleryItem => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    url: item.url,
    size: typeof item.size === "number" ? item.size : undefined,
    uploadedDate: item.createdAt || item.updatedAt || new Date().toISOString(),
    mediaType: toMediaType(item.mediaType) as GalleryItem["mediaType"],
  })

  const loadGallery = async () => {
    setLoading(true)
    setApiError("")
    try {
      const res = await fetch("/api/gallery", {
        headers: { ...getSessionHeaders() },
      })
      if (res.status === 503) {
        setApiError("Database not configured — showing demo gallery.")
        setImages(mockImages)
        return
      }
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to load gallery")
      const items = Array.isArray(data.items) ? data.items.map(mapItem) : []
      setImages(items.length ? items : mockImages)
    } catch (err: any) {
      console.error("Failed to load gallery", err)
      setApiError(err?.message || "Failed to load gallery")
      setImages(mockImages)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGallery()
  }, [])

  const totalPages = Math.max(1, Math.ceil(images.length / pageSize))
  const pagedImages = useMemo(() => {
    return images.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [images, currentPage, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/gallery?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) {
        const data = await parseJsonSafe(res)
        throw new Error(data?.error || "Failed to delete")
      }
      setImages((prev) => prev.filter((img) => img.id !== id))
    } catch (err) {
      console.warn("Failed to delete gallery item", err)
      setImages((prev) => prev.filter((img) => img.id !== id))
    } finally {
      setDeleteId(null)
    }
  }

  const handleDownload = (image: GalleryItem) => {
    const link = document.createElement("a")
    link.href = image.url
    link.download = `${image.title || "media"}`
    link.click()
  }

  const handleShare = async (image: GalleryItem) => {
    try {
      await navigator.clipboard.writeText(image.url)
    } catch {
      // ignore clipboard errors
    }
    setSharedImage(image.id)
    setTimeout(() => setSharedImage(null), 2000)
  }

  const handleView = (image: GalleryItem) => {
    window.open(image.url, "_blank", "noopener,noreferrer")
  }

  const openAddDialog = () => {
    setEditingId(null)
    setSelectedFile(null)
    setPreviewUrl("")
    setForm({ title: "", description: "", url: "", size: "", mediaType: "image" })
    setUploadError("")
    setDialogOpen(true)
  }

  const openEditDialog = (image: GalleryItem) => {
    setEditingId(image.id)
    setSelectedFile(null)
    setPreviewUrl("")
    setForm({
      title: image.title,
      description: image.description || "",
      url: image.url,
      size: image.size ? formatFileSize(image.size) : "",
      mediaType: image.mediaType,
    })
    setUploadError("")
    setDialogOpen(true)
  }

  const handleFileUpload = (file?: File | null) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large. Please upload a file under 5 MB.")
      return
    }
    setSelectedFile(file)
    setForm((prev) => ({
      ...prev,
      mediaType: file.type.startsWith("video") ? "video" : "image",
      size: formatFileSize(file.size),
    }))
    setUploadError("")
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
    const data = await parseJsonSafe(res)
    if (!res.ok) throw new Error(data?.error || "Upload failed")
    return data as { url: string; bytes?: number; resourceType?: string }
  }

  const saveMedia = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    setUploadError("")
    try {
      let url = form.url.trim()
      let bytes: number | undefined
      let mediaType = form.mediaType

      if (selectedFile) {
        const uploaded = await uploadToCloudinary(selectedFile, "civis/gallery")
        url = uploaded.url
        bytes = uploaded.bytes
        mediaType = uploaded.resourceType === "video" ? "video" : form.mediaType
      }

      if (!url) {
        setUploadError("Please upload a file or provide a URL.")
        return
      }

      const manualSize = Number.parseFloat(form.size.replace(/[^0-9.]/g, ""))
      const sizeValue = bytes ?? (Number.isNaN(manualSize) ? undefined : Math.round(manualSize * 1024 * 1024))

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        url,
        mediaType,
        size: sizeValue,
      }

      if (editingId) {
        const res = await fetch("/api/gallery", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({ id: editingId, ...payload }),
        })
        const data = await parseJsonSafe(res)
        if (!res.ok) throw new Error(data?.error || "Failed to update")
        const updated = mapItem(data.item)
        setImages((prev) => prev.map((img) => (img.id === editingId ? updated : img)))
      } else {
        const res = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify(payload),
        })
        const data = await parseJsonSafe(res)
        if (!res.ok) throw new Error(data?.error || "Failed to create")
        const created = mapItem(data.item)
        setImages((prev) => [created, ...prev])
        setCurrentPage(1)
      }

      setDialogOpen(false)
      setEditingId(null)
      setSelectedFile(null)
      setPreviewUrl("")
      setForm({ title: "", description: "", url: "", size: "", mediaType: "image" })
    } catch (err: any) {
      console.warn("Failed to save media", err)
      setUploadError(err?.message || "Failed to save media")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground">Manage and organize your media files</p>
            {apiError ? <p className="text-xs text-muted-foreground mt-2">{apiError}</p> : null}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={openAddDialog}>
                <Plus className="w-4 h-4" />
                Add Media
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Media" : "Add Media"}</DialogTitle>
                <DialogDescription>Upload a new image or video preview to the gallery.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="media-title">Title</Label>
                  <Input
                    id="media-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Media title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-description">Description</Label>
                  <Textarea
                    id="media-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="media-type">Media Type</Label>
                    <Select
                      value={form.mediaType}
                      onValueChange={(value) => setForm({ ...form, mediaType: value as GalleryItem["mediaType"] })}
                    >
                      <SelectTrigger id="media-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="media-size">File Size (optional)</Label>
                    <Input
                      id="media-size"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      placeholder="Auto-filled from upload"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-file">Upload File</Label>
                  <Input
                    id="media-file"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
                  <p className="text-xs text-muted-foreground">Max 5 MB. Uploading replaces the URL.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-url">Thumbnail URL</Label>
                  <Input
                    id="media-url"
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                {previewUrl || form.url ? (
                  <div className="rounded-lg border border-border p-3 bg-muted/30">
                    {form.mediaType === "video" ? (
                      <video
                        src={previewUrl || form.url}
                        controls
                        className="w-full h-48 rounded-md object-cover"
                      />
                    ) : (
                      <img src={previewUrl || form.url} alt="Preview" className="w-full h-48 rounded-md object-cover" />
                    )}
                  </div>
                ) : null}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="bg-transparent" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveMedia} disabled={saving}>
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : editingId ? (
                      "Save Changes"
                    ) : (
                      "Add Media"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading gallery...
          </div>
        ) : images.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No images yet</p>
              <Button onClick={openAddDialog}>Upload Media</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedImages.map((image) => (
              <div
                key={image.id}
                className="rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative bg-muted h-48 overflow-hidden group">
                  <img
                    src={image.url || "/placeholder.svg"}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {image.mediaType === "video" ? (
                    <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      Video
                    </div>
                  ) : null}
                  <button
                    onClick={() => handleView(image)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Eye className="w-6 h-6 text-white" />
                  </button>
                </div>

                <Item className="flex-col rounded-none border-0">
                  <ItemContent>
                    <ItemTitle>{image.title}</ItemTitle>
                    <ItemDescription>{image.description}</ItemDescription>
                    <ItemDescription className="text-xs mt-2">
                      {formatFileSize(image.size)} • {new Date(image.uploadedDate).toLocaleDateString()}
                    </ItemDescription>
                  </ItemContent>

                  <ItemFooter className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2 w-full">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(image)}
                        title="Download image"
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant={sharedImage === image.id ? "default" : "outline"}
                        onClick={() => handleShare(image)}
                        title="Share image"
                        className="flex-1"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        {sharedImage === image.id ? "Copied!" : "Share"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(image)}
                        title="Edit media"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteId(image.id)}
                        title="Delete image"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </ItemFooter>
                </Item>
              </div>
            ))}
          </div>
        )}
        {images.length > 0 ? (
          <div className="pt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
