"use client"

import { useState } from "react"
import { Download, Trash2, Share2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Item, ItemContent, ItemTitle, ItemDescription, ItemFooter } from "@/components/ui/item"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mock gallery data
const mockImages = [
  {
    id: 1,
    title: "Team Meeting",
    description: "Q4 Planning Session - November 2025",
    url: "/team-meeting-office.png",
    size: "2.4 MB",
    uploadedDate: "2025-11-05",
  },
  {
    id: 2,
    title: "Product Launch",
    description: "Civis ERP Platform Launch Event",
    url: "/product-launch-event.png",
    size: "3.1 MB",
    uploadedDate: "2025-10-28",
  },
  {
    id: 3,
    title: "Office Workspace",
    description: "New Office Layout Design",
    url: "/modern-office.png",
    size: "1.8 MB",
    uploadedDate: "2025-10-15",
  },
  {
    id: 4,
    title: "Dashboard Interface",
    description: "Civis Dashboard UI Preview",
    url: "/dashboard-analytics-interface.png",
    size: "2.7 MB",
    uploadedDate: "2025-10-10",
  },
  {
    id: 5,
    title: "Team Collaboration",
    description: "Cross-functional Team Workshop",
    url: "/team-collaboration.png",
    size: "2.9 MB",
    uploadedDate: "2025-09-22",
  },
  {
    id: 6,
    title: "Conference Presentation",
    description: "ERP Solutions Presentation",
    url: "/business-conference-presentation.jpg",
    size: "3.3 MB",
    uploadedDate: "2025-09-15",
  },
]

export default function GalleryPage() {
  const [images, setImages] = useState(mockImages)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [sharedImage, setSharedImage] = useState<number | null>(null)

  const handleDelete = (id: number) => {
    setImages(images.filter((img) => img.id !== id))
    setDeleteId(null)
  }

  const handleDownload = (image: (typeof mockImages)[0]) => {
    console.log("[v0] Downloading:", image.title)
    alert(`Downloading: ${image.title}`)
  }

  const handleShare = (id: number) => {
    setSharedImage(id)
    setTimeout(() => setSharedImage(null), 2000)
  }

  const handleView = (image: (typeof mockImages)[0]) => {
    console.log("[v0] Viewing:", image.title)
    alert(`Viewing: ${image.title}`)
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground">Manage and organize your media files</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {images.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No images yet</p>
              <Button>Upload Images</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
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
                    <div className="flex gap-2 w-full">
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
