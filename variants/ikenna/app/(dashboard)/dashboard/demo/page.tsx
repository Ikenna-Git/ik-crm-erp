"use client"

import { useState } from "react"
import { Play, Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const demoVideos = [
  {
    id: 1,
    title: "Getting Started with Ikenna",
    description: "Learn the basics of navigating the Ikenna ERP & CRM platform in just 5 minutes.",
    duration: "5:23",
    thumbnail: "/getting-started-dashboard.jpg",
    category: "Fundamentals",
  },
  {
    id: 2,
    title: "CRM Module Deep Dive",
    description: "Master customer relationship management with contacts, deals, and activity tracking.",
    duration: "8:45",
    thumbnail: "/crm-contacts-management.jpg",
    category: "CRM",
  },
  {
    id: 3,
    title: "Accounting & Invoicing",
    description: "Complete guide to managing invoices, expenses, and financial reporting.",
    duration: "7:12",
    thumbnail: "/accounting-invoices-reports.jpg",
    category: "Accounting",
  },
  {
    id: 4,
    title: "Inventory Management",
    description: "Learn how to manage products, stock levels, and purchase orders efficiently.",
    duration: "6:30",
    thumbnail: "/inventory-stock-management.jpg",
    category: "Inventory",
  },
  {
    id: 5,
    title: "Project Management",
    description: "Organize projects, tasks, and timelines with the powerful project management module.",
    duration: "9:15",
    thumbnail: "/project-management-tasks.jpg",
    category: "Projects",
  },
  {
    id: 6,
    title: "HR & Payroll",
    description: "Manage employees, payroll, and attendance with integrated HR tools.",
    duration: "7:48",
    thumbnail: "/hr-payroll-employees.jpg",
    category: "HR",
  },
  {
    id: 7,
    title: "Analytics Dashboard",
    description: "Generate insights and reports from your business data in real-time.",
    duration: "5:56",
    thumbnail: "/analytics-dashboard-insights.jpg",
    category: "Analytics",
  },
  {
    id: 8,
    title: "API Integration",
    description: "Connect third-party applications and automate your workflows.",
    duration: "10:32",
    thumbnail: "/api-integration-automation.jpg",
    category: "Integration",
  },
  {
    id: 9,
    title: "Security & Compliance",
    description: "Understand user roles, permissions, and data security features.",
    duration: "6:18",
    thumbnail: "/security-compliance-data.jpg",
    category: "Security",
  },
]

export default function DemoPage() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<(typeof demoVideos)[0] | null>(null)

  const handleShare = (title: string) => {
    alert(`Demo "${title}" link copied to clipboard!`)
  }

  const handleDownload = (title: string) => {
    alert(`Downloading "${title}"...`)
  }

  const handleDelete = (id: number) => {
    alert(`Video ${id} deleted!`)
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Video Demos & Tutorials</h1>
          <p className="text-muted-foreground text-lg">
            Learn how to use Ikenna's powerful features with our comprehensive video library.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="bg-primary/10 border-primary text-primary">
            All Videos
          </Button>
          <Button variant="outline" size="sm">
            Fundamentals
          </Button>
          <Button variant="outline" size="sm">
            CRM
          </Button>
          <Button variant="outline" size="sm">
            Accounting
          </Button>
          <Button variant="outline" size="sm">
            Inventory
          </Button>
          <Button variant="outline" size="sm">
            Projects
          </Button>
          <Button variant="outline" size="sm">
            HR
          </Button>
          <Button variant="outline" size="sm">
            Analytics
          </Button>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoVideos.map((video) => (
            <div
              key={video.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors"
            >
              {/* Thumbnail with Play Button */}
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
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div
                    className={`w-16 h-16 rounded-full bg-primary flex items-center justify-center transition-transform ${hoveredId === video.id ? "scale-110" : "scale-100"}`}
                  >
                    <Play className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-black/80 px-2 py-1 rounded text-xs font-semibold text-white">
                  {video.duration}
                </div>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 bg-primary px-3 py-1 rounded-full text-xs font-semibold text-primary-foreground">
                  {video.category}
                </div>
              </div>

              {/* Video Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-base mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                </div>

                {/* Action Buttons */}
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

      {/* Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div className="bg-card rounded-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative bg-muted h-96 flex items-center justify-center">
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
