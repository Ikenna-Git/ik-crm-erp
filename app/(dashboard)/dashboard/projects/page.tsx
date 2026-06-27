"use client"

import { useEffect, useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BriefcaseBusiness, Download, Link2, Plus, ShieldCheck, Sparkles } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"
import { requestJson, getApiErrorMessage } from "@/lib/api-client"
import { LiquidGlassPanel } from "@/components/ui/liquid-glass-panel"

const today = () => new Date().toISOString().slice(0, 10)
const toDateString = (value?: string | null) => (value ? String(value).slice(0, 10) : today())

const mapProject = (project: any): Project => ({
  id: project.id,
  name: project.name,
  description: project.description || "",
  client: project.client || "",
  ownerName: project.ownerName || "",
  siteName: project.siteName || "",
  location: project.location || "",
  linkedRecords: project.linkedRecords && typeof project.linkedRecords === "object" ? project.linkedRecords : {},
  proofLinks: Array.isArray(project.proofLinks) ? project.proofLinks : [],
  externalLinks: Array.isArray(project.externalLinks) ? project.externalLinks : [],
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
  const [crmCompanies, setCrmCompanies] = useState<Array<{ id: string; label: string }>>([])
  const [crmContacts, setCrmContacts] = useState<Array<{ id: string; label: string }>>([])
  const [crmDeals, setCrmDeals] = useState<Array<{ id: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openProjectDialog, setOpenProjectDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<"all" | Project["status"]>("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    ownerName: "",
    siteName: "",
    location: "",
    budget: "",
    status: "planning",
  })

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [projectsRes, tasksRes, companiesRes, contactsRes, dealsRes] = await Promise.all([
        requestJson<any>("/api/projects"),
        requestJson<any>("/api/projects/tasks"),
        requestJson<any>("/api/crm/companies"),
        requestJson<any>("/api/crm/contacts"),
        requestJson<any>("/api/crm/deals"),
      ])
      setProjects((projectsRes.projects || []).map(mapProject))
      setTasks((tasksRes.tasks || []).map(mapTask))
      setCrmCompanies(
        Array.isArray(companiesRes.companies)
          ? companiesRes.companies.map((company: any) => ({ id: company.id, label: company.name || company.id }))
          : [],
      )
      setCrmContacts(
        Array.isArray(contactsRes.contacts)
          ? contactsRes.contacts.map((contact: any) => ({ id: contact.id, label: contact.name || contact.email || contact.id }))
          : [],
      )
      setCrmDeals(
        Array.isArray(dealsRes.deals)
          ? dealsRes.deals.map((deal: any) => ({ id: deal.id, label: deal.title || deal.id }))
          : [],
      )
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load projects"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const addProject = async (data: Omit<Project, "id">) => {
    const response = await requestJson<any>("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
        description: `Workspace delivery for ${projectForm.client}`,
        client: projectForm.client,
        ownerName: projectForm.ownerName,
        siteName: projectForm.siteName,
        location: projectForm.location,
        proofLinks: [],
        externalLinks: [],
        status: projectForm.status as Project["status"],
        priority: "medium",
        progress: 0,
        team: 0,
        budget: Number.parseFloat(projectForm.budget || "0"),
        spent: 0,
        startDate,
        endDate: startDate,
      })
      setProjectForm({ name: "", client: "", ownerName: "", siteName: "", location: "", budget: "", status: "planning" })
      setOpenProjectDialog(false)
      setError("")
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create project"))
    }
  }

  const handleUpdateProject = async (id: string, data: Omit<Project, "id">) => {
    try {
      const response = await requestJson<any>("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      })
      setProjects((prev) => prev.map((project) => (project.id === id ? mapProject(response.project) : project)))
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update project"))
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await requestJson(`/api/projects?id=${id}`, { method: "DELETE" })
      setProjects((prev) => prev.filter((project) => project.id !== id))
      setTasks((prev) => prev.filter((task) => task.project !== projects.find((project) => project.id === id)?.name))
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete project"))
    }
  }

  const handleAddTask = async (data: Omit<Task, "id">) => {
    try {
      const targetProject = projects.find((project) => project.name === data.project)
      const response = await requestJson<any>("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, projectId: targetProject?.id, proofLinks: [] }),
      })
      setTasks((prev) => [mapTask(response.task), ...prev])
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to create task"))
    }
  }

  const handleUpdateTask = async (id: string, data: Omit<Task, "id">) => {
    try {
      const targetProject = projects.find((project) => project.name === data.project)
      const response = await requestJson<any>("/api/projects/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data, projectId: targetProject?.id }),
      })
      setTasks((prev) => prev.map((task) => (task.id === id ? mapTask(response.task) : task)))
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update task"))
    }
  }

  const handleDeleteTask = async (id: string) => {
    try {
      await requestJson(`/api/projects/tasks?id=${id}`, { method: "DELETE" })
      setTasks((prev) => prev.filter((task) => task.id !== id))
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete task"))
    }
  }

  const handleExportReport = () => {
    toast({
      title: "Project export not available here",
      description: "Use the reports module for project exports in this release.",
    })
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

  const inFlightProjects = projects.filter((project) => project.status === "in-progress")
  const linkedArtifactCount = projects.reduce(
    (sum, project) => sum + (project.proofLinks?.length || 0) + (project.externalLinks?.length || 0),
    0,
  )

  return (
    <div className="space-y-6 p-6">
      <LiquidGlassPanel className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Projects for engineering, operations, logistics, and service delivery
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Projects now carry delivery context, not just status.</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                Link customer work to sites, owners, timelines, proof, and external systems so delivery teams can trace a
                project from CRM promise to operational execution.
              </p>
              {loading ? <p className="mt-2 text-xs text-muted-foreground">Loading live project and task data...</p> : null}
              {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
            </div>
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
                  <DialogDescription>Add a delivery workspace with owner and site context.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="proj-name">Project Name</Label>
                    <Input id="proj-name" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="proj-client">Client/Department</Label>
                      <Input id="proj-client" value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proj-owner">Owner</Label>
                      <Input id="proj-owner" value={projectForm.ownerName} onChange={(e) => setProjectForm({ ...projectForm, ownerName: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="proj-site">Site / Environment</Label>
                      <Input id="proj-site" value={projectForm.siteName} onChange={(e) => setProjectForm({ ...projectForm, siteName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proj-location">Location</Label>
                      <Input id="proj-location" value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="proj-budget">Budget</Label>
                      <Input id="proj-budget" type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proj-status">Status</Label>
                      <Select value={projectForm.status} onValueChange={(value) => setProjectForm({ ...projectForm, status: value })}>
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
                  </div>
                  <Button onClick={handleAddProject} className="w-full">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            { label: "Projects", value: projects.length, hint: "Workspace delivery records", icon: BriefcaseBusiness },
            { label: "Active", value: inFlightProjects.length, hint: "Projects currently executing", icon: ShieldCheck },
            { label: "Tasks", value: tasks.length, hint: "Cross-project work items", icon: Sparkles },
            { label: "Linked proof", value: linkedArtifactCount, hint: "Proof and external links captured", icon: Link2 },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <item.icon className="h-4 w-4 text-primary" />
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-xl font-semibold">{item.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>
      </LiquidGlassPanel>

      <LiquidGlassPanel className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Delivery pulse</p>
            <p className="text-sm text-muted-foreground">Filter projects by live status while keeping CRM, evidence, and billing follow-through in scope.</p>
          </div>
          <div className="min-w-[180px]">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="h-9 text-sm bg-background/70">
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
      </LiquidGlassPanel>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="board">Projects</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <LiquidGlassPanel className="p-5 xl:col-span-2">
              <h3 className="text-lg font-semibold">What this page should carry</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Projects in Civis should support engineering teams, field teams, operations, and service businesses. That
                means owner context, site context, proof links, repository links, ticket links, and billing follow-through.
              </p>
            </LiquidGlassPanel>
            <LiquidGlassPanel className="p-5">
              <h3 className="text-lg font-semibold">Next delivery habit</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Use the project record for execution, attach external proof as you go, and keep invoice-ready client details
                in sync with CRM and Accounting.
              </p>
            </LiquidGlassPanel>
          </div>
        </TabsContent>

        <TabsContent value="board" className="space-y-4">
            <ProjectsBoard
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              projects={projects}
              crmCompanies={crmCompanies}
              crmContacts={crmContacts}
              crmDeals={crmDeals}
              uploadsEnabled={Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)}
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
