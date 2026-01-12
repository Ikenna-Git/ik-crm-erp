"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sparkles, Play, CheckCircle2, ClipboardList } from "lucide-react"

type PlaybookTemplate = {
  id: string
  name: string
  category: string
  summary: string
  steps: string[]
  eta: string
}

type PlaybookRun = {
  id: string
  templateId: string
  name: string
  category: string
  status: "Active" | "Paused" | "Completed"
  progress: number
  startedAt: string
}

const templates: PlaybookTemplate[] = [
  {
    id: "tpl-1",
    name: "Sales Pipeline Kickoff",
    category: "CRM",
    summary: "Launch a structured pipeline with stages, tasks, and follow-ups.",
    steps: [
      "Define pipeline stages and owners",
      "Import or create top 50 leads",
      "Assign next-step tasks for each lead",
      "Schedule weekly pipeline review",
      "Enable automated follow-up reminders",
    ],
    eta: "2 weeks",
  },
  {
    id: "tpl-2",
    name: "Monthly Close",
    category: "Accounting",
    summary: "Standardize invoicing, reconciliations, and finance reporting.",
    steps: [
      "Collect all outstanding invoices",
      "Reconcile bank transactions",
      "Review expense categories",
      "Generate finance summary report",
      "Send close-out report to stakeholders",
    ],
    eta: "7 days",
  },
  {
    id: "tpl-3",
    name: "New Hire Onboarding",
    category: "HR",
    summary: "Get new hires productive with a 30-day onboarding plan.",
    steps: [
      "Create employee profile and contract",
      "Assign hardware and access credentials",
      "Schedule onboarding sessions",
      "Share department goals and KPIs",
      "Run 30-day performance check-in",
    ],
    eta: "30 days",
  },
  {
    id: "tpl-4",
    name: "Inventory Reorder Cycle",
    category: "Inventory",
    summary: "Automate reorder points and supplier follow-ups.",
    steps: [
      "Audit top 25 SKUs",
      "Set reorder thresholds",
      "Notify suppliers and create PO drafts",
      "Schedule weekly stock reviews",
      "Monitor delivery SLAs",
    ],
    eta: "10 days",
  },
]

const runSeed: PlaybookRun[] = [
  {
    id: "run-1",
    templateId: "tpl-2",
    name: "January Close",
    category: "Accounting",
    status: "Active",
    progress: 45,
    startedAt: "3 days ago",
  },
  {
    id: "run-2",
    templateId: "tpl-1",
    name: "Q1 Pipeline Launch",
    category: "CRM",
    status: "Paused",
    progress: 20,
    startedAt: "Last week",
  },
]

const STORAGE_KEY = "civis_playbook_runs"

export default function PlaybooksPage() {
  const [runs, setRuns] = useState<PlaybookRun[]>(runSeed)
  const [selectedTemplate, setSelectedTemplate] = useState<PlaybookTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setRuns(parsed)
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runSeed))
    } catch {
      setRuns(runSeed)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs))
  }, [runs])

  useEffect(() => {
    if (!dialogOpen) {
      setSelectedTemplate(null)
    }
  }, [dialogOpen])

  const launchPlaybook = (template: PlaybookTemplate) => {
    setRuns((prev) => [
      {
        id: `run-${Date.now()}`,
        templateId: template.id,
        name: template.name,
        category: template.category,
        status: "Active",
        progress: 10,
        startedAt: "Just now",
      },
      ...prev,
    ])
  }

  const advanceRun = (id: string) => {
    setRuns((prev) =>
      prev.map((run) => {
        if (run.id !== id) return run
        const nextProgress = Math.min(run.progress + 20, 100)
        return {
          ...run,
          progress: nextProgress,
          status: nextProgress >= 100 ? "Completed" : run.status,
        }
      }),
    )
  }

  const pauseRun = (id: string) => {
    setRuns((prev) => prev.map((run) => (run.id === id ? { ...run, status: "Paused" } : run)))
  }

  const openTemplate = (template: PlaybookTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Playbooks & Templates</h1>
        <p className="text-muted-foreground">
          Launch proven workflows for CRM, finance, HR, and operations in one click.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Playbook Templates
          </CardTitle>
          <CardDescription>Ready-to-run checklists built for your teams.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="rounded-lg border border-border bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.summary}</p>
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{template.steps.length} steps</span>
                <span>ETA {template.eta}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openTemplate(template)}>
                  Preview
                </Button>
                <Button size="sm" onClick={() => launchPlaybook(template)}>
                  Launch
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            Active Runs
          </CardTitle>
          <CardDescription>Track progress for live playbooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {runs.map((run) => (
            <div key={run.id} className="rounded-lg border border-border bg-background p-4 space-y-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{run.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.category} • Started {run.startedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{run.status}</Badge>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => pauseRun(run.id)}>
                    Pause
                  </Button>
                  <Button size="sm" onClick={() => advanceRun(run.id)}>
                    Advance
                  </Button>
                </div>
              </div>
              <Progress value={run.progress} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{run.progress}% complete</span>
                {run.progress >= 100 ? (
                  <span className="flex items-center gap-1 text-primary">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    In progress
                  </span>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.summary}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedTemplate?.steps.map((step, idx) => (
              <div key={step} className="flex gap-3 rounded-lg border border-border p-3 bg-muted/20">
                <span className="text-sm font-semibold text-primary">#{idx + 1}</span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  if (selectedTemplate) {
                    launchPlaybook(selectedTemplate)
                    setDialogOpen(false)
                  }
                }}
              >
                Launch playbook
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
