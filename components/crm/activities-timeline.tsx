"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Calendar, Users } from "lucide-react"
import { PaginationControls } from "@/components/shared/pagination-controls"

interface Activity {
  id: string
  type: "call" | "email" | "meeting" | "note"
  title: string
  contact: string
  date: string
  time: string
  description: string
}

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: Users,
}

const activityColors = {
  call: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-500/40",
  email: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-500/40",
  meeting: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-200 dark:border-green-500/40",
  note: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-200 dark:border-yellow-500/40",
}

type ActivitiesTimelineProps = {
  activities?: Activity[]
}

export function ActivitiesTimeline({ activities = [] }: ActivitiesTimelineProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize))
  const pagedActivities = activities.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activities and interactions</CardDescription>
      </CardHeader>
      <CardContent>
        {pagedActivities.length ? (
          <>
            <div className="space-y-6">
              {pagedActivities.map((activity, idx) => {
                const Icon = activityIcons[activity.type]
                return (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${activityColors[activity.type]} border`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      {idx < pagedActivities.length - 1 && <div className="w-1 h-12 bg-border my-2" />}
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm">{activity.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{activity.contact}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {activity.date} at {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="pt-6">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No CRM activity yet. Calls, emails, notes, and meetings will appear here once your team starts using the workspace.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
