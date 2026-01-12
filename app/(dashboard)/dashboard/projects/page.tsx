"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Download, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectsBoard, type Project, mockProjects } from "@/components/projects/projects-board"
import { TasksKanban } from "@/components/projects/tasks-kanban"
import { TimelineView } from "@/components/projects/timeline-view"

export default function ProjectsPage() {
  const searchQuery = ""
  const [projects, setProjects] = useState<Project[]>(mockProjects)
  const [openProjectDialog, setOpenProjectDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all")
  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    budget: "",
    status: "planning",
  })

  const handleAddProject = () => {
    if (projectForm.name && projectForm.client) {
      const today = new Date().toISOString().slice(0, 10)
      const payload: Omit<Project, "id"> = {
        name: projectForm.name,
        description: `Client: ${projectForm.client}`,
        client: projectForm.client,
        status: projectForm.status as Project["status"],
        priority: "medium",
        progress: 0,
        team: 0,
        budget: Number.parseFloat(projectForm.budget || "0"),
        spent: 0,
        startDate: today,
        endDate: today,
      }
      setProjects((prev) => [{ id: Date.now().toString(), ...payload }, ...prev])
      setProjectForm({ name: "", client: "", budget: "", status: "planning" })
      setOpenProjectDialog(false)
    }
  }

  const handleUpdateProject = (id: string, data: Omit<Project, "id">) => {
    setProjects((prev) => prev.map((project) => (project.id === id ? { id, ...data } : project)))
  }

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id))
  }

  const handleExportReport = () => {
    console.log("Exporting report to email/download")
    alert("Report exported successfully! You can download it or check your email.")
  }

  const handleEditTask = () => {
    console.log("Edit task functionality")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage projects, tasks, and timelines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={handleExportReport}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Dialog open={openProjectDialog} onOpenChange={setOpenProjectDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Add a new project to your workspace</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proj-name">Project Name</Label>
                  <Input
                    id="proj-name"
                    placeholder="e.g., Website Redesign"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-client">Client/Department</Label>
                  <Input
                    id="proj-client"
                    placeholder="e.g., Acme Corp"
                    value={projectForm.client}
                    onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-budget">Budget</Label>
                  <Input
                    id="proj-budget"
                    type="number"
                    placeholder="e.g., 1,500,000"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proj-status">Status</Label>
                  <Select
                    value={projectForm.status}
                    onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Project Pulse */}
      <div className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Project Pulse</p>
            <p className="text-sm text-muted-foreground">Keep milestones on track with live project health.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Total: {projects.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            In progress: {projects.filter((project) => project.status === "in-progress").length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Completed: {projects.filter((project) => project.status === "completed").length}
          </span>
          <div className="min-w-[160px]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="board" className="space-y-4">
          <ProjectsBoard
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            projects={projects}
            onAddProject={(data) => setProjects((prev) => [{ id: Date.now().toString(), ...data }, ...prev])}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <TasksKanban searchQuery={searchQuery} />
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <TimelineView searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
