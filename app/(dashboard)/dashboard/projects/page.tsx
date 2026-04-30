"use client"

import { useEffect, useMemo, useState } from "react"
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
import { ProjectsBoard, type Project } from "@/components/projects/projects-board"
import { TasksKanban, type Task } from "@/components/projects/tasks-kanban"
import { TimelineView, type TimelineItem } from "@/components/projects/timeline-view"

const today = () => new Date().toISOString().slice(0, 10)
const toDateString = (value?: string | null) => (value ? String(value).slice(0, 10) : today())

const requestJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data
}

const mapProject = (project: any): Project => ({
  id: project.id,
  name: project.name,
  description: project.description || "",
  client: project.client || "",
  status: ["planning", "in-progress", "on-hold", "completed"].includes(project.status) ? project.status : "planning",
  priority: ["low", "medium", "high"].includes(project.priority) ? project.priority : "medium",
  progress: Number(project.progress || 0),
  team: Number(project.team || 0),
  budget: Number(project.budget || 0),
  spent: Number(project.spent || 0),
  startDate: toDateString(project.startDate || project.createdAt),
  endDate: toDateString(project.endDate || project.updatedAt),
})

const mapTask = (task: any): Task => ({
  id: task.id,
  title: task.title,
  project: task.project?.name || "General",
  assignee: task.assignee || "Unassigned",
  startDate: toDateString(task.startDate || task.createdAt),
  endDate: toDateString(task.endDate || task.updatedAt),
  priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
  stage: ["todo", "in-progress", "review", "done"].includes(task.stage) ? task.stage : "todo",
})

export default function ProjectsPage() {
  const searchQuery = ""
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openProjectDialog, setOpenProjectDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all")
  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    budget: "",
    status: "planning",
  })

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [projectsRes, tasksRes] = await Promise.all([requestJson("/api/projects"), requestJson("/api/projects/tasks")])
      setProjects((projectsRes.projects || []).map(mapProject))
      setTasks((tasksRes.tasks || []).map(mapTask))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addProject = async (data: Omit<Project, "id">) => {
    const response = await requestJson("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
    setProjects((prev) => [mapProject(response.project), ...prev])
  }

  const handleAddProject = async () => {
    if (!projectForm.name || !projectForm.client) return
    try {
      const startDate = today()
      await addProject({
        name: projectForm.name,
        description: `Client: ${projectForm.client}`,
        client: projectForm.client,
        status: projectForm.status as Project["status"],
        priority: "medium",
        progress: 0,
        team: 0,
        budget: Number.parseFloat(projectForm.budget || "0"),
        spent: 0,
        startDate,
        endDate: startDate,
      })
      setProjectForm({ name: "", client: "", budget: "", status: "planning" })
      setOpenProjectDialog(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project")
    }
  }

  const handleUpdateProject = async (id: string, data: Omit<Project, "id">) => {
    try {
      const response = await requestJson("/api/projects", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      })
      setProjects((prev) => prev.map((project) => (project.id === id ? mapProject(response.project) : project)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update project")
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await requestJson(`/api/projects?id=${id}`, { method: "DELETE" })
      setProjects((prev) => prev.filter((project) => project.id !== id))
      setTasks((prev) => prev.filter((task) => task.project !== projects.find((project) => project.id === id)?.name))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete project")
    }
  }

  const handleAddTask = async (data: Omit<Task, "id">) => {
    try {
      const targetProject = projects.find((project) => project.name === data.project)
      const response = await requestJson("/api/projects/tasks", {
        method: "POST",
        body: JSON.stringify({ ...data, projectId: targetProject?.id }),
      })
      setTasks((prev) => [mapTask(response.task), ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task")
    }
  }

  const handleUpdateTask = async (id: string, data: Omit<Task, "id">) => {
    try {
      const targetProject = projects.find((project) => project.name === data.project)
      const response = await requestJson("/api/projects/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data, projectId: targetProject?.id }),
      })
      setTasks((prev) => prev.map((task) => (task.id === id ? mapTask(response.task) : task)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task")
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await requestJson(`/api/projects/tasks?id=${id}`, { method: "DELETE" })
      setTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task")
    }
  }

  const handleExportReport = () => {
    window.alert("Project export is ready through the reports module. Use Docs/API if you want raw endpoint access.")
  }

  const timelineItems = useMemo<TimelineItem[]>(
    () =>
      projects.map((project) => ({
        id: project.id,
        project: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        progress: project.progress,
        status: project.status,
      })),
    [projects],
  )

  return (
    <div className="p-6 space-y-6">
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
                    placeholder="e.g., 1500000"
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

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

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
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Total: {projects.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            In progress: {projects.filter((project) => project.status === "in-progress").length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Completed: {projects.filter((project) => project.status === "completed").length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">{loading ? "Syncing" : "Live DB"}</span>
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

      <Tabs defaultValue="board" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="board">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          <ProjectsBoard
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            projects={projects}
            onAddProject={addProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TasksKanban
            searchQuery={searchQuery}
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <TimelineView searchQuery={searchQuery} items={timelineItems} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
