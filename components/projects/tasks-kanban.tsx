"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    title: "",
    project: "",
    assignee: "",
    dueDate: "",
    priority: "medium" as Task["priority"],
    stage: "todo" as Task["stage"],
  })

  const openEditor = (task?: Task) => {
    if (task) {
      setEditingId(task.id)
      setForm({
        title: task.title,
        project: task.project,
        assignee: task.assignee,
        dueDate: task.dueDate,
        priority: task.priority,
        stage: task.stage,
      })
    } else {
      setEditingId(null)
      setForm({
        title: "",
        project: "",
        assignee: "",
        dueDate: "",
        priority: "medium",
        stage: "todo",
      })
    }
    setShowModal(true)
  }

  const saveTask = () => {
    const payload: Task = {
      id: editingId || Date.now().toString(),
      title: form.title || "New Task",
      project: form.project || "General",
      assignee: form.assignee || "Unassigned",
      dueDate: form.dueDate || new Date().toISOString().slice(0, 10),
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStages.map((stage) => {
          const stageTasks = tasks.filter(
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{editingId ? "Edit Task" : "Add Task"}</h3>
                  <p className="text-sm text-muted-foreground">Update assignment, priority, and due date.</p>
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
                  <Label className="text-sm font-medium">Due date</Label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
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
