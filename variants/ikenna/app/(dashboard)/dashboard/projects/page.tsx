"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search, Download } from "lucide-react"
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
import { ProjectsBoard } from "@/components/projects/projects-board"
import { TasksKanban } from "@/components/projects/tasks-kanban"
import { TimelineView } from "@/components/projects/timeline-view"

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openProjectDialog, setOpenProjectDialog] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: "",
    client: "",
    budget: "",
    status: "planning",
  })

  const handleAddProject = () => {
    if (projectForm.name && projectForm.client) {
      console.log("Adding project:", projectForm)
      setProjectForm({ name: "", client: "", budget: "", status: "planning" })
      setOpenProjectDialog(false)
    }
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search projects, tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
          <ProjectsBoard searchQuery={searchQuery} />
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
