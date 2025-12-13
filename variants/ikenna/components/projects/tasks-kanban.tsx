"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"

interface Task {
  id: string
  title: string
  project: string
  assignee: string
  dueDate: string
  priority: "low" | "medium" | "high"
  stage: "todo" | "in-progress" | "review" | "done"
}

const taskStages = [
  { id: "todo", title: "To Do", color: "bg-slate-50" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-50" },
  { id: "review", title: "Review", color: "bg-yellow-50" },
  { id: "done", title: "Done", color: "bg-green-50" },
]

const mockTasks: Task[] = [
  {
    id: "1",
    title: "Design homepage mockup",
    project: "Website Redesign",
    assignee: "Sarah Chen",
    dueDate: "2025-02-10",
    priority: "high",
    stage: "in-progress",
  },
  {
    id: "2",
    title: "Setup development environment",
    project: "Mobile App Development",
    assignee: "John Smith",
    dueDate: "2025-02-15",
    priority: "high",
    stage: "in-progress",
  },
  {
    id: "3",
    title: "Write API documentation",
    project: "Mobile App Development",
    assignee: "Jane Doe",
    dueDate: "2025-02-20",
    priority: "medium",
    stage: "todo",
  },
  {
    id: "4",
    title: "Code review - Auth module",
    project: "Website Redesign",
    assignee: "Mike Johnson",
    dueDate: "2025-02-08",
    priority: "high",
    stage: "review",
  },
  {
    id: "5",
    title: "Deploy to staging",
    project: "Website Redesign",
    assignee: "Sarah Chen",
    dueDate: "2025-02-25",
    priority: "medium",
    stage: "done",
  },
]

const priorityColors = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
}

export function TasksKanban({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStages.map((stage) => {
          const stageTasks = mockTasks.filter(
            (t) => t.stage === stage.id && t.title.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          return (
            <div key={stage.id} className={`${stage.color} rounded-lg p-4 min-h-96`}>
              <div className="mb-4">
                <h3 className="font-semibold text-sm">{stage.title}</h3>
                <p className="text-xs text-muted-foreground">{stageTasks.length} tasks</p>
              </div>
              <div className="space-y-3">
                {stageTasks.map((task) => (
                  <Card key={task.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-2">{task.project}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {task.assignee.split(" ")[0]}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
