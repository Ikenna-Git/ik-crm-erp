"use client"

import { useEffect, useMemo, useState } from "react"
import { Play, Download, Share2, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PaginationControls } from "@/components/shared/pagination-controls"

type DemoVideo = {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  category: string
  videoUrl?: string
}

const STORAGE_KEY = "civis_demo_videos"
const categoryOrder = ["Fundamentals", "CRM", "Accounting", "Inventory", "Projects", "HR", "Analytics", "Integration", "Security"]

const demoTitles = [
  "Getting Started with Civis",
  "CRM Module Deep Dive",
  "Accounting & Invoicing",
  "Inventory Management",
  "Project Management",
  "HR & Payroll",
  "Analytics Dashboard",
  "API Integration",
  "Security & Compliance",
]

const demoDescriptions = [
  "Learn the basics of navigating the Civis ERP & CRM platform in just 5 minutes.",
  "Master customer relationship management with contacts, deals, and activity tracking.",
  "Complete guide to managing invoices, expenses, and financial reporting.",
  "Learn how to manage products, stock levels, and purchase orders efficiently.",
  "Organize projects, tasks, and timelines with the powerful project management module.",
  "Manage employees, payroll, and attendance with integrated HR tools.",
  "Generate insights and reports from your business data in real-time.",
  "Connect third-party applications and automate your workflows.",
  "Understand user roles, permissions, and data security features.",
]

const demoThumbnails = [
  "/getting-started-dashboard.jpg",
  "/crm-contacts-management.jpg",
  "/accounting-invoices-reports.jpg",
  "/inventory-stock-management.jpg",
  "/project-management-tasks.jpg",
  "/hr-payroll-employees.jpg",
  "/analytics-dashboard-insights.jpg",
  "/api-integration-automation.jpg",
  "/security-compliance-data.jpg",
]

const buildDemoVideos = (count: number): DemoVideo[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `DEM-${(idx + 1).toString().padStart(3, "0")}`,
    title: demoTitles[idx % demoTitles.length],
    description: demoDescriptions[idx % demoDescriptions.length],
    duration: `${5 + (idx % 6)}:${(idx % 60).toString().padStart(2, "0")}`,
    thumbnail: demoThumbnails[idx % demoThumbnails.length],
    category: categoryOrder[idx % categoryOrder.length],
    videoUrl: "",
  }))

const demoVideos: DemoVideo[] = buildDemoVideos(70)
const normalizeKey = (video: DemoVideo) =>
  `${video.title.toLowerCase().trim()}::${video.category.toLowerCase().trim()}`
const dedupeVideos = (items: DemoVideo[]) => {
  const byId = new Map<string, DemoVideo>()
  items.forEach((item) => {
    if (!byId.has(item.id)) byId.set(item.id, item)
  })
  const bySignature = new Map<string, DemoVideo>()
  Array.from(byId.values()).forEach((item) => {
    const signature = normalizeKey(item)
    if (!bySignature.has(signature)) {
      bySignature.set(signature, item)
    }
  })
  return Array.from(bySignature.values())
}

export default function DemoPage() {
  const [videos, setVideos] = useState<DemoVideo[]>(demoVideos)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    thumbnail: "",
    category: "Fundamentals",
    videoUrl: "",
  })

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

  const handleThumbnailUpload = (file?: File | null) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large. Please upload a file under 5 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setForm((prev) => ({ ...prev, thumbnail: result }))
      setUploadError("")
    }
    reader.readAsDataURL(file)
  }

  const handleVideoUpload = (file?: File | null) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large. Please upload a file under 5 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setForm((prev) => ({ ...prev, videoUrl: result }))
      setUploadError("")
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const merged = dedupeVideos([...parsed, ...demoVideos])
          setVideos(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeVideos(demoVideos)))
    } catch (err) {
      console.warn("Failed to load demo videos", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos))
    } catch (err) {
      console.warn("Failed to persist demo videos", err)
    }
  }, [videos])

  useEffect(() => {
    setCurrentPage(1)
  }, [videos.length, pageSize])

  const totalPages = Math.max(1, Math.ceil(videos.length / pageSize))
  const pagedVideos = videos.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const video of videos) {
      map.set(video.category, (map.get(video.category) || 0) + 1)
    }
    return map
  }, [videos])

  const grouped = useMemo(() => {
    const map = new Map<string, DemoVideo[]>()
    for (const video of pagedVideos) {
      if (!map.has(video.category)) map.set(video.category, [])
      map.get(video.category)!.push(video)
    }
    const ordered = Array.from(new Set([...categoryOrder, ...map.keys()]))
    return ordered.filter((c) => map.has(c)).map((c) => ({ category: c, videos: map.get(c)! }))
  }, [pagedVideos])

  const handleShare = (title: string) => {
    alert(`Demo "${title}" link copied to clipboard!`)
  }

  const handleDownload = (title: string) => {
    alert(`Downloading "${title}"...`)
  }

  const handleDelete = (id: string) => {
    const confirmed = window.confirm("Delete this demo video?")
    if (!confirmed) return
    setVideos((prev) => prev.filter((video) => video.id !== id))
  }

  const openAddDialog = () => {
    setEditingId(null)
    setForm({ title: "", description: "", duration: "", thumbnail: "", category: "Fundamentals", videoUrl: "" })
    setUploadError("")
    setDialogOpen(true)
  }

  const openEditDialog = (video: DemoVideo) => {
    setEditingId(video.id)
    setForm({
      title: video.title,
      description: video.description,
      duration: video.duration,
      thumbnail: video.thumbnail,
      category: video.category,
      videoUrl: video.videoUrl || "",
    })
    setUploadError("")
    setDialogOpen(true)
  }

  const saveVideo = () => {
    if (!form.title.trim()) return
    const payload: DemoVideo = {
      id: editingId || Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      duration: form.duration.trim() || "0:00",
      thumbnail: form.thumbnail.trim() || "/placeholder.svg",
      category: form.category.trim() || "Other",
      videoUrl: form.videoUrl?.trim() || "",
    }
    if (editingId) {
      setVideos((prev) => dedupeVideos(prev.map((video) => (video.id === editingId ? payload : video))))
    } else {
      setVideos((prev) => dedupeVideos([payload, ...prev]))
    }
    setDialogOpen(false)
    setEditingId(null)
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Video Demos & Tutorials</h1>
            <p className="text-muted-foreground text-lg">
              Learn how to use Civis' powerful features with our comprehensive video library.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" onClick={openAddDialog}>
                <Plus className="w-4 h-4" />
                Add Demo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Demo" : "Add Demo"}</DialogTitle>
                <DialogDescription>Add a new tutorial or update an existing demo video.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-title">Title</Label>
                  <Input
                    id="demo-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Demo title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-description">Description</Label>
                  <Textarea
                    id="demo-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Short description"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="demo-category">Category</Label>
                    <Input
                      id="demo-category"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="e.g., CRM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-duration">Duration</Label>
                    <Input
                      id="demo-duration"
                      value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="e.g., 5:30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-thumbnail-upload">Upload Thumbnail</Label>
                  <Input
                    id="demo-thumbnail-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleThumbnailUpload(e.target.files?.[0])}
                  />
                  {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-thumbnail">Thumbnail URL</Label>
                  <Input
                    id="demo-thumbnail"
                    value={form.thumbnail}
                    onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demo-video-upload">Upload Demo Video</Label>
                  <Input
                    id="demo-video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleVideoUpload(e.target.files?.[0])}
                  />
                  {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
                  <p className="text-xs text-muted-foreground">Max 5 MB for local preview.</p>
                </div>
                {form.thumbnail || form.videoUrl ? (
                  <div className="rounded-lg border border-border p-3 bg-muted/30 space-y-3">
                    {form.thumbnail ? (
                      <img src={form.thumbnail} alt="Thumbnail preview" className="w-full h-44 object-cover rounded-md" />
                    ) : null}
                    {form.videoUrl ? (
                      <video src={form.videoUrl} controls className="w-full h-44 rounded-md object-cover" />
                    ) : null}
                  </div>
                ) : null}
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" className="bg-transparent" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveVideo}>{editingId ? "Save Changes" : "Add Demo"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Videos grouped by category */}
        <div className="space-y-10">
          {grouped.map(({ category, videos }) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <p className="text-sm text-muted-foreground">Demos focused on {category.toLowerCase()}.</p>
                </div>
                <Button variant="outline" size="sm">
                  {categoryCounts.get(category) || videos.length} videos
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
                  >
                    <div
                      className="relative overflow-hidden bg-muted h-48 cursor-pointer group"
                      onMouseEnter={() => setHoveredId(video.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => setSelectedVideo(video)}
                    >
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                        <div
                          className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center transition-transform ${hoveredId === video.id ? "scale-110" : "scale-100"}`}
                        >
                          <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white">
                        {video.duration}
                      </div>
                      <div className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground">
                        {video.category}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-base mb-1 line-clamp-2">{video.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(video)}
                            aria-label="Edit demo"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(video.id)}
                            aria-label="Delete demo"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => handleDownload(video.title)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => handleShare(video.title)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-8">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="bg-card rounded-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-muted h-96 flex items-center justify-center">
              {selectedVideo.videoUrl ? (
                <video src={selectedVideo.videoUrl} controls className="w-full h-full object-cover" />
              ) : (
                <>
                  <img
                    src={selectedVideo.thumbnail || "/placeholder.svg"}
                    alt={selectedVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                    </div>
                  </div>
                </>
              )}
              <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white">
                {selectedVideo.duration}
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedVideo.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedVideo.description}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {selectedVideo.category}
                </span>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" variant="secondary" onClick={() => handleDownload(selectedVideo.title)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => handleShare(selectedVideo.title)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
