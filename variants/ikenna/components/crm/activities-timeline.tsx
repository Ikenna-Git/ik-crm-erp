"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Calendar, Users } from "lucide-react"

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
  call: "bg-blue-50 text-blue-700 border-blue-200",
  email: "bg-purple-50 text-purple-700 border-purple-200",
  meeting: "bg-green-50 text-green-700 border-green-200",
  note: "bg-yellow-50 text-yellow-700 border-yellow-200",
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "call",
    title: "Product Demo Call",
    contact: "Sarah Johnson",
    date: "Today",
    time: "2:00 PM",
    description: "Discussed enterprise features and pricing",
  },
  {
    id: "2",
    type: "email",
    title: "Follow-up Email",
    contact: "Michael Chen",
    date: "Yesterday",
    time: "10:30 AM",
    description: "Sent proposal document and contract",
  },
  {
    id: "3",
    type: "meeting",
    title: "Board Meeting",
    contact: "Emma Davis",
    date: "2 days ago",
    time: "3:00 PM",
    description: "Quarterly business review and planning",
  },
  {
    id: "4",
    type: "note",
    title: "Implementation Notes",
    contact: "Global Industries",
    date: "3 days ago",
    time: "1:15 PM",
    description: "Documented customer requirements and timeline",
  },
]

export function ActivitiesTimeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activities and interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockActivities.map((activity, idx) => {
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
      </CardContent>
    </Card>
  )
}
