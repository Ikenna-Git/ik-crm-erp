"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TimelineItem {
  id: string
  project: string
  startDate: string
  endDate: string
  progress: number
  status: "planning" | "in-progress" | "on-hold" | "completed"
}

const mockTimeline: TimelineItem[] = [
  {
    id: "1",
    project: "Website Redesign",
    startDate: "2025-01-15",
    endDate: "2025-03-31",
    progress: 65,
    status: "in-progress",
  },
  {
    id: "2",
    project: "Mobile App Development",
    startDate: "2024-12-01",
    endDate: "2025-06-30",
    progress: 45,
    status: "in-progress",
  },
  {
    id: "3",
    project: "Data Migration",
    startDate: "2025-02-01",
    endDate: "2025-04-30",
    progress: 10,
    status: "planning",
  },
  {
    id: "4",
    project: "Marketing Campaign",
    startDate: "2024-12-15",
    endDate: "2025-01-31",
    progress: 100,
    status: "completed",
  },
]

const statusColors = {
  planning: "bg-blue-200",
  "in-progress": "bg-yellow-200",
  "on-hold": "bg-orange-200",
  completed: "bg-green-200",
}

export function TimelineView({ searchQuery }: { searchQuery: string }) {
  const filteredItems = mockTimeline.filter((item) => item.project.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
        <CardDescription>Gantt-style view of all projects and their timelines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {filteredItems.map((item) => {
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
      </CardContent>
    </Card>
  )
}
