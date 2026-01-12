"use client"

import { useEffect, useState } from "react"
import { Download, Trash2, Share2, Eye, Plus, Edit, Play } from "lucide-react"
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

type GalleryItem = {
  id: string
  title: string
  description: string
  url: string
  size: string
  uploadedDate: string
  mediaType: "image" | "video"
}

const STORAGE_KEY = "civis_gallery_items"

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
    size: `${(1.5 + (idx % 5) * 0.4).toFixed(1)} MB`,
    uploadedDate: new Date(2025, (idx % 10) + 1, (idx % 27) + 1).toISOString().slice(0, 10),
    mediaType: idx % 6 === 0 ? "video" : "image",
  }))

const mockImages: GalleryItem[] = buildMockGallery(70)

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryItem[]>(mockImages)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [sharedImage, setSharedImage] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    size: "",
    mediaType: "image" as GalleryItem["mediaType"],
  })

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

  const formatFileSize = (bytes: number) => {
    if (!bytes && bytes !== 0) return "—"
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const merged = [
            ...parsed,
            ...mockImages.filter((seed) => !parsed.some((item: GalleryItem) => item.id === seed.id)),
          ]
          setImages(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockImages))
    } catch (err) {
      console.warn("Failed to load gallery items", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(images))
    } catch (err) {
      console.warn("Failed to persist gallery items", err)
    }
  }, [images])

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE))
  const pagedImages = images.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleDelete = (id: string) => {
    setImages(images.filter((img) => img.id !== id))
    setDeleteId(null)
  }

  const handleDownload = (image: GalleryItem) => {
    console.log("[v0] Downloading:", image.title)
    alert(`Downloading: ${image.title}`)
  }

  const handleShare = (id: string) => {
    setSharedImage(id)
    setTimeout(() => setSharedImage(null), 2000)
  }

  const handleView = (image: GalleryItem) => {
    console.log("[v0] Viewing:", image.title)
    alert(`Viewing: ${image.title}`)
  }

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ title: "", description: "", url: "", size: "", mediaType: "image" })
    setUploadError("")
    setDialogOpen(true)
  }

  const openEditDialog = (image: GalleryItem) => {
    setEditingId(image.id)
    setForm({
      title: image.title,
      description: image.description,
      url: image.url,
      size: image.size,
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
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setForm((prev) => ({
        ...prev,
        url: result,
        size: formatFileSize(file.size),
        mediaType: file.type.startsWith("video") ? "video" : "image",
      }))
      setUploadError("")
    }
    reader.readAsDataURL(file)
  }

  const saveMedia = () => {
    if (!form.title.trim()) return
    const existing = editingId ? images.find((img) => img.id === editingId) : undefined
    const payload: GalleryItem = {
      id: editingId || Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      size: form.size.trim() || existing?.size || "—",
      uploadedDate: existing?.uploadedDate || new Date().toISOString().slice(0, 10),
      mediaType: form.mediaType,
    }
    if (editingId) {
      setImages((prev) => prev.map((img) => (img.id === editingId ? payload : img)))
    } else {
      setImages((prev) => [payload, ...prev])
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground">Manage and organize your media files</p>
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="media-size">File Size (optional)</Label>
                    <Input
                      id="media-size"
                      value={form.size}
                      onChange={(e) => setForm({ ...form, size: e.target.value })}
                      placeholder="e.g., 12 MB"
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
                  <p className="text-xs text-muted-foreground">Max 5 MB. Uploading a file will replace the URL.</p>
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
                {form.url ? (
                  <div className="rounded-lg border border-border p-3 bg-muted/30">
                    {form.mediaType === "video" ? (
                      <video src={form.url} controls className="w-full h-48 rounded-md object-cover" />
                    ) : (
                      <img src={form.url} alt="Preview" className="w-full h-48 rounded-md object-cover" />
                    )}
                  </div>
                ) : null}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="bg-transparent" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveMedia}>{editingId ? "Save Changes" : "Add Media"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {images.length === 0 ? (
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
                {/* Image Container */}
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

                {/* Item Info */}
                <Item className="flex-col rounded-none border-0">
                  <ItemContent>
                    <ItemTitle>{image.title}</ItemTitle>
                    <ItemDescription>{image.description}</ItemDescription>
                    <ItemDescription className="text-xs mt-2">
                      {image.size} • {new Date(image.uploadedDate).toLocaleDateString()}
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
                        onClick={() => handleShare(image.id)}
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
            />
          </div>
        ) : null}
      </div>

      {/* Delete Confirmation Dialog */}
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
