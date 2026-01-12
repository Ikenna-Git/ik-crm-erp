"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PaginationControls } from "@/components/shared/pagination-controls"

interface TimelineItem {
  id: string
  project: string
  startDate: string
  endDate: string
  progress: number
  status: "planning" | "in-progress" | "on-hold" | "completed"
}

const timelineProjects = [
  "Website Redesign",
  "Mobile App Development",
  "Data Migration",
  "Marketing Campaign",
  "Customer Portal",
  "ERP Upgrade",
  "Support Revamp",
  "Analytics Refresh",
]

const timelineStatuses: TimelineItem["status"][] = ["planning", "in-progress", "on-hold", "completed"]

const buildMockTimeline = (count: number): TimelineItem[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `TL-${(idx + 1).toString().padStart(3, "0")}`,
    project: timelineProjects[idx % timelineProjects.length],
    startDate: new Date(2025, (idx % 6), (idx % 27) + 1).toISOString().slice(0, 10),
    endDate: new Date(2025, (idx % 6) + 2, (idx % 27) + 10).toISOString().slice(0, 10),
    progress: idx % 4 === 0 ? 100 : 15 + (idx % 6) * 12,
    status: timelineStatuses[idx % timelineStatuses.length],
  }))

const mockTimeline: TimelineItem[] = buildMockTimeline(70)

const statusColors = {
  planning: "bg-blue-200 dark:bg-blue-500/30",
  "in-progress": "bg-yellow-200 dark:bg-yellow-500/30",
  "on-hold": "bg-orange-200 dark:bg-orange-500/30",
  completed: "bg-green-200 dark:bg-green-500/30",
}

export function TimelineView({ searchQuery }: { searchQuery: string }) {
  const [currentPage, setCurrentPage] = useState(1)
  const filteredItems = mockTimeline.filter((item) => item.project.toLowerCase().includes(searchQuery.toLowerCase()))

  const sortedItems = [...filteredItems].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const pagedItems = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Gantt-style view of all projects and their timelines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {pagedItems.map((item) => {
            // Simple timeline visualization
            const today = new Date("2025-02-01")
            const start = new Date(item.startDate)
            const end = new Date(item.endDate)
            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            const startPercent = Math.max(0, (elapsedDays / totalDays) * 100)
            const width = Math.min(100, (item.progress / 100) * 100)

            return (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{item.project}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.startDate} - {item.endDate}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{item.progress}%</span>
                </div>
                <div className="w-full h-6 bg-muted rounded-lg overflow-hidden relative border border-border">
                  <div
                    className={`h-full ${statusColors[item.status]} transition-all`}
                    style={{ width: `${width}%` }}
                  />
                  <div className="absolute inset-0 flex items-center">
                    {width > 15 && <span className="text-xs font-medium text-foreground ml-2">{item.progress}%</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="pt-6">
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </CardContent>
    </Card>
  )
}
