"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Flag, Eye, Trash2 } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "in-progress" | "on-hold" | "completed"
  progress: number
  team: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  priority: "low" | "medium" | "high"
}

const statusColors = {
  planning: "bg-blue-100 text-blue-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  "on-hold": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
}

const priorityColors = {
  low: "text-blue-600",
  medium: "text-yellow-600",
  high: "text-red-600",
}

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of company website",
    status: "in-progress",
    progress: 65,
    team: 5,
    budget: 25000,
    spent: 16250,
    startDate: "2025-01-15",
    endDate: "2025-03-31",
    priority: "high",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "New iOS and Android application",
    status: "in-progress",
    progress: 45,
    team: 8,
    budget: 75000,
    spent: 33750,
    startDate: "2024-12-01",
    endDate: "2025-06-30",
    priority: "high",
  },
  {
    id: "3",
    name: "Data Migration",
    description: "Migrate legacy systems to cloud",
    status: "planning",
    progress: 10,
    team: 3,
    budget: 15000,
    spent: 1500,
    startDate: "2025-02-01",
    endDate: "2025-04-30",
    priority: "medium",
  },
  {
    id: "4",
    name: "Marketing Campaign",
    description: "Q1 product launch campaign",
    status: "completed",
    progress: 100,
    team: 4,
    budget: 8000,
    spent: 7850,
    startDate: "2024-12-15",
    endDate: "2025-01-31",
    priority: "medium",
  },
]

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export function ProjectsBoard({ searchQuery }: { searchQuery: string }) {
  const filteredProjects = mockProjects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-2xl font-bold">{mockProjects.filter((p) => p.status === "in-progress").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-primary">
              {formatNaira(mockProjects.reduce((s, p) => s + p.budget, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-accent">
              {formatNaira(mockProjects.reduce((s, p) => s + p.spent, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Team Members</p>
            <p className="text-2xl font-bold">{mockProjects.reduce((s, p) => s + p.team, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project) => {
          const budgetUtilization = ((project.spent / project.budget) * 100).toFixed(0)
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 ${priorityColors[project.priority]}`}
                      >
                        <Flag className="w-3 h-3" />
                        {project.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>

                  {/* Project Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">Timeline</p>
                        <p className="font-medium text-sm">
                          {project.startDate} - {project.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-muted-foreground text-xs">Team</p>
                        <p className="font-medium text-sm">{project.team} Members</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Budget</p>
                      <p className="font-medium text-sm">{formatNaira(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Utilization</p>
                      <p className="font-medium text-sm">{budgetUtilization}%</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
