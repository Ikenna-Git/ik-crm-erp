"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Flag, Eye, Trash2, MoreHorizontal, Edit, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "planning" as Project["status"],
    priority: "medium" as Project["priority"],
    progress: "",
    team: "",
    budget: "",
    spent: "",
    startDate: "",
    endDate: "",
  })

  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const openEditor = (project?: Project) => {
    if (project) {
      setEditingId(project.id)
      setForm({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        progress: String(project.progress),
        team: String(project.team),
        budget: String(project.budget),
        spent: String(project.spent),
        startDate: project.startDate,
        endDate: project.endDate,
      })
    } else {
      setEditingId(null)
      setForm({
        name: "",
        description: "",
        status: "planning",
        priority: "medium",
        progress: "",
        team: "",
        budget: "",
        spent: "",
        startDate: "",
        endDate: "",
      })
    }
    setShowModal(true)
  }

  const saveProject = () => {
    const payload: Project = {
      id: editingId || Date.now().toString(),
      name: form.name || "New Project",
      description: form.description || "Project description",
      status: form.status,
      priority: form.priority,
      progress: Number(form.progress || 0),
      team: Number(form.team || 0),
      budget: Number(form.budget || 0),
      spent: Number(form.spent || 0),
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      endDate: form.endDate || new Date().toISOString().slice(0, 10),
    }
    if (editingId) {
      setProjects((prev) => prev.map((p) => (p.id === editingId ? payload : p)))
    } else {
      setProjects((prev) => [payload, ...prev])
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-2xl font-bold">{projects.filter((p) => p.status === "in-progress").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-primary">
              {formatNaira(projects.reduce((s, p) => s + p.budget, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-2xl font-bold text-accent">
              {formatNaira(projects.reduce((s, p) => s + p.spent, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Team Members</p>
            <p className="text-2xl font-bold">{projects.reduce((s, p) => s + p.team, 0)}</p>
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
                  <div className="flex gap-2 pt-2 justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => alert(JSON.stringify(project, null, 2))}>
                          <Eye className="w-4 h-4 mr-2" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditor(project)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{editingId ? "Edit Project" : "Add Project"}</h3>
                  <p className="text-sm text-muted-foreground">Update project scope, status, and budget.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Project name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Project["priority"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Progress (%)</Label>
                  <Input
                    type="number"
                    value={form.progress}
                    onChange={(e) => setForm({ ...form, progress: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Team size</Label>
                  <Input type="number" value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Budget</Label>
                  <Input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Spent</Label>
                  <Input type="number" value={form.spent} onChange={(e) => setForm({ ...form, spent: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Start date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">End date</Label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveProject}>{editingId ? "Save changes" : "Add project"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
