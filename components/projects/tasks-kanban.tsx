"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Task {
  id: string
  title: string
  project: string
  assignee: string
  startDate: string
  endDate: string
  priority: "low" | "medium" | "high"
  stage: "todo" | "in-progress" | "review" | "done"
}

const taskStages = [
  { id: "todo", title: "To Do", color: "bg-slate-50 dark:bg-slate-900/40" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "review", title: "Review", color: "bg-yellow-50 dark:bg-yellow-950/30" },
  { id: "done", title: "Done", color: "bg-green-50 dark:bg-green-950/30" },
]

const taskTitles = [
  "Design homepage mockup",
  "Setup development environment",
  "Write API documentation",
  "Code review - Auth module",
  "Deploy to staging",
  "Refine onboarding flow",
  "Sync data model",
  "QA regression suite",
]

const taskProjects = ["Website Redesign", "Mobile App Development", "Data Migration", "Customer Portal"]
const taskAssignees = ["Sarah Chen", "John Smith", "Jane Doe", "Mike Johnson", "Grace Martins", "Noah Brown"]
const taskStagesValues: Task["stage"][] = ["todo", "in-progress", "review", "done"]
const priorityValues: Task["priority"][] = ["low", "medium", "high"]

const buildMockTasks = (count: number): Task[] =>
  Array.from({ length: count }, (_, idx) => {
    const start = new Date(2025, idx % 6, (idx % 27) + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 7 + (idx % 10))

    return {
      id: `TSK-${(idx + 1).toString().padStart(3, "0")}`,
      title: taskTitles[idx % taskTitles.length],
      project: taskProjects[idx % taskProjects.length],
      assignee: taskAssignees[idx % taskAssignees.length],
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      priority: priorityValues[idx % priorityValues.length],
      stage: taskStagesValues[idx % taskStagesValues.length],
    }
  })

const mockTasks: Task[] = buildMockTasks(70)

const priorityColors = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
}

export function TasksKanban({ searchQuery }: { searchQuery: string }) {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stageFilter, setStageFilter] = useState<"all" | Task["stage"]>("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | Task["priority"]>("all")
  const [form, setForm] = useState({
    title: "",
    project: "",
    assignee: "",
    startDate: "",
    endDate: "",
    priority: "medium" as Task["priority"],
    stage: "todo" as Task["stage"],
  })

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase()
    const matchesQuery = task.title.toLowerCase().includes(query)
    const matchesStage = stageFilter === "all" ? true : task.stage === stageFilter
    const matchesPriority = priorityFilter === "all" ? true : task.priority === priorityFilter
    const matchesMonth = monthFilter === "all" ? true : task.startDate.startsWith(monthFilter)
    return matchesQuery && matchesStage && matchesPriority && matchesMonth
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / PAGE_SIZE))
  const pagedTasks = sortedTasks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const monthOptions = Array.from(new Set(tasks.map((task) => task.startDate.slice(0, 7)))).sort()
  const visibleStages =
    stageFilter === "all" ? taskStages : taskStages.filter((stage) => stage.id === stageFilter)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, stageFilter, monthFilter, priorityFilter])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openEditor = (task?: Task) => {
    if (task) {
      setEditingId(task.id)
      setForm({
        title: task.title,
        project: task.project,
        assignee: task.assignee,
        startDate: task.startDate,
        endDate: task.endDate,
        priority: task.priority,
        stage: task.stage,
      })
    } else {
      setEditingId(null)
      setForm({
        title: "",
        project: "",
        assignee: "",
        startDate: "",
        endDate: "",
        priority: "medium",
        stage: "todo",
      })
    }
    setShowModal(true)
  }

  const saveTask = () => {
    const today = new Date().toISOString().slice(0, 10)
    const startDate = form.startDate || today
    const rawEndDate = form.endDate || startDate
    const endDate = rawEndDate < startDate ? startDate : rawEndDate
    const payload: Task = {
      id: editingId || Date.now().toString(),
      title: form.title || "New Task",
      project: form.project || "General",
      assignee: form.assignee || "Unassigned",
      startDate,
      endDate,
      priority: form.priority,
      stage: form.stage,
    }
    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? payload : t)))
    } else {
      setTasks((prev) => [payload, ...prev])
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const moveToNextStage = (task: Task) => {
    const stageOrder: Task["stage"][] = ["todo", "in-progress", "review", "done"]
    const currentIdx = stageOrder.indexOf(task.stage)
    const nextStage = stageOrder[Math.min(currentIdx + 1, stageOrder.length - 1)]
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, stage: nextStage } : t)))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card/60 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">Filter tasks by month, stage, or priority.</div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-9 w-[160px] bg-background text-sm">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              {monthOptions.map((month) => (
                <SelectItem key={month} value={month}>
                  {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
                    new Date(`${month}-01`),
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={(value) => setStageFilter(value as typeof stageFilter)}>
            <SelectTrigger className="h-9 w-[150px] bg-background text-sm">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as typeof priorityFilter)}>
            <SelectTrigger className="h-9 w-[150px] bg-background text-sm">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="h-9 bg-transparent"
            onClick={() => {
              setMonthFilter("all")
              setStageFilter("all")
              setPriorityFilter("all")
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleStages.map((stage) => {
          const stageTasks = pagedTasks.filter((t) => t.stage === stage.id)
          const grouped = stageTasks.reduce<Record<string, Task[]>>((acc, task) => {
            const key = task.startDate.slice(0, 7)
            if (!acc[key]) acc[key] = []
            acc[key].push(task)
            return acc
          }, {})
          const groupKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
          return (
            <div key={stage.id} className={`${stage.color} rounded-lg p-4 min-h-96`}>
              <div className="mb-4">
                <h3 className="font-semibold text-sm">{stage.title}</h3>
                <p className="text-xs text-muted-foreground">{stageTasks.length} tasks</p>
              </div>
              <div className="space-y-4">
                {groupKeys.map((month) => (
                  <div key={month} className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(
                        new Date(`${month}-01`),
                      )}
                    </p>
                    {grouped[month].map((task) => (
                      <Card key={task.id} className="bg-card hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm line-clamp-2">{task.title}</p>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-1 h-7 w-7">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => alert(JSON.stringify(task, null, 2))}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditor(task)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => moveToNextStage(task)}>
                                  Move to next stage
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteTask(task.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{task.project}</p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className={priorityColors[task.priority]}>
                              {task.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                                new Date(task.startDate),
                              )}{" "}
                              -{" "}
                              {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
                                new Date(task.endDate),
                              )}
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
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{editingId ? "Edit Task" : "Add Task"}</h3>
                  <p className="text-sm text-muted-foreground">Update assignment, priority, and timeline.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Assignee</Label>
                  <Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} />
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
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Stage</Label>
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value as Task["stage"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveTask}>{editingId ? "Save changes" : "Add task"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
