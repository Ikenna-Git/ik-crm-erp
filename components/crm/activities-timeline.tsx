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

const activityTitles = ["Product Demo Call", "Follow-up Email", "Board Meeting", "Implementation Notes", "Kickoff Call"]
const activityContacts = ["Sarah Johnson", "Michael Chen", "Emma Davis", "Global Industries", "Acme Corp", "Northwind"]
const activityTypes: Activity["type"][] = ["call", "email", "meeting", "note"]

const buildMockActivities = (count: number): Activity[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `ACT-${(idx + 1).toString().padStart(3, "0")}`,
    type: activityTypes[idx % activityTypes.length],
    title: activityTitles[idx % activityTitles.length],
    contact: activityContacts[idx % activityContacts.length],
    date: `${(idx % 7) + 1} days ago`,
    time: `${(idx % 12) + 1}:00 PM`,
    description: "Captured notes and next steps for the account.",
  }))

const mockActivities: Activity[] = buildMockActivities(70)

export function ActivitiesTimeline() {
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(mockActivities.length / PAGE_SIZE))
  const pagedActivities = mockActivities.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
                  {idx < mockActivities.length - 1 && <div className="w-1 h-12 bg-border my-2" />}
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
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </CardContent>
    </Card>
  )
}
