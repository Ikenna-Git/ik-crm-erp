"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, CheckSquare, Lock } from "lucide-react"

const timelineSeed = [
  { id: "t1", title: "Invoice INV-2025-014 paid", detail: "Acme Corp • ₦1,250,000", time: "2 hours ago", type: "finance" },
  { id: "t2", title: "Approval completed", detail: "Payroll batch January", time: "Yesterday", type: "approval" },
  { id: "t3", title: "Workflow triggered", detail: "Low stock alert sent", time: "Yesterday", type: "workflow" },
  { id: "t4", title: "New integration connected", detail: "Paystack payments", time: "2 days ago", type: "integration" },
]

const workflowSeed = [
  { id: "w1", name: "Overdue invoice reminder", trigger: "Invoice overdue 7 days", action: "Send email + WhatsApp", active: true },
  { id: "w2", name: "Low stock reorder", trigger: "Stock below reorder point", action: "Create purchase order", active: true },
  { id: "w3", name: "New hire onboarding", trigger: "Employee created", action: "Assign onboarding tasks", active: false },
]

const approvalsSeed = [
  { id: "a1", request: "Payroll January", owner: "HR", amount: "₦3,500,000", status: "pending" },
  { id: "a2", request: "Purchase order PO-2025-011", owner: "Procurement", amount: "₦850,000", status: "pending" },
  { id: "a3", request: "Expense reimbursement", owner: "Finance", amount: "₦120,000", status: "approved" },
]

const integrationsSeed = [
  { id: "i1", name: "Paystack", category: "Payments", connected: false },
  { id: "i2", name: "Flutterwave", category: "Payments", connected: false },
  { id: "i3", name: "WhatsApp", category: "Messaging", connected: false },
  { id: "i4", name: "Slack", category: "Messaging", connected: false },
  { id: "i5", name: "Email (SMTP)", category: "Email", connected: true },
  { id: "i6", name: "Google Calendar", category: "Calendar", connected: false },
  { id: "i7", name: "SAP / Oracle / Sage", category: "ERP", connected: false },
  { id: "i8", name: "ChatGPT (OpenAI)", category: "AI", connected: false },
  { id: "i9", name: "Google Gemini", category: "AI", connected: false },
  { id: "i10", name: "Anthropic Claude", category: "AI", connected: false },
]

const insightsSeed = [
  { id: "ai1", title: "Follow up on top 5 overdue invoices", reason: "Total ₦2.4m past due", impact: "High" },
  { id: "ai2", title: "Reorder Wireless Mouse", reason: "Stock below threshold", impact: "Medium" },
  { id: "ai3", title: "Schedule Q2 performance reviews", reason: "90 days since last review", impact: "Medium" },
]

const auditSeed = [
  { id: "log1", actor: "Adaeze Okafor", action: "Updated invoice INV-2025-003", time: "Today 09:15" },
  { id: "log2", actor: "Emeka Umeh", action: "Approved payroll batch January", time: "Yesterday 17:32" },
  { id: "log3", actor: "Sarah Johnson", action: "Created workflow: Low stock reorder", time: "Yesterday 14:10" },
]

const complianceSeed = [
  { id: "c1", title: "2FA enforced for admins", status: "complete" },
  { id: "c2", title: "Data retention policy (7 years)", status: "complete" },
  { id: "c3", title: "Access logs reviewed monthly", status: "in-progress" },
  { id: "c4", title: "Backup verification", status: "pending" },
]

const reportsSeed = [
  {
    id: "r1",
    name: "Monthly payroll summary",
    dataset: "HR",
    metrics: "Payroll costs",
    groupBy: "Month",
    schedule: "Monthly",
    notes: "Send to CFO and HR lead",
    owner: "HR",
    lastRun: "Not run yet",
  },
  {
    id: "r2",
    name: "Sales pipeline conversion",
    dataset: "CRM",
    metrics: "Win rate",
    groupBy: "Stage",
    schedule: "Weekly",
    notes: "",
    owner: "CRM",
    lastRun: "Not run yet",
  },
]

const STORAGE = {
  workflows: "civis_ops_workflows",
  integrations: "civis_ops_integrations",
  reports: "civis_ops_reports",
}

const approvalStatusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/40",
  approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/40",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40",
}

export default function OperationsPage() {
  const [timeline] = useState(timelineSeed)
  const [workflows, setWorkflows] = useState(workflowSeed)
  const [approvals, setApprovals] = useState(approvalsSeed)
  const [integrations, setIntegrations] = useState(integrationsSeed)
  const [insights, setInsights] = useState(insightsSeed)
  const [auditLogs] = useState(auditSeed)
  const [compliance, setCompliance] = useState(complianceSeed)
  const [reports, setReports] = useState(reportsSeed)

  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    trigger: "",
    action: "",
  })

  const [reportForm, setReportForm] = useState({
    name: "",
    dataset: "CRM",
    metrics: "Revenue",
    groupBy: "Month",
    schedule: "Monthly",
    notes: "",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const load = <T,>(key: string, fallback: T, setter: (value: T) => void) => {
      try {
        const stored = localStorage.getItem(key)
        if (stored) {
          setter(JSON.parse(stored))
          return
        }
        localStorage.setItem(key, JSON.stringify(fallback))
      } catch {
        setter(fallback)
      }
    }
    load(STORAGE.workflows, workflowSeed, setWorkflows)
    load(STORAGE.reports, reportsSeed, setReports)

    try {
      const stored = localStorage.getItem(STORAGE.integrations)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const merged = [
            ...parsed,
            ...integrationsSeed.filter((seed) => !parsed.some((item: { id: string }) => item.id === seed.id)),
          ]
          setIntegrations(merged)
          localStorage.setItem(STORAGE.integrations, JSON.stringify(merged))
          return
        }
      }
      localStorage.setItem(STORAGE.integrations, JSON.stringify(integrationsSeed))
    } catch {
      setIntegrations(integrationsSeed)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE.workflows, JSON.stringify(workflows))
  }, [workflows])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE.integrations, JSON.stringify(integrations))
  }, [integrations])

  useEffect(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE.reports, JSON.stringify(reports))
  }, [reports])

  const addWorkflow = () => {
    const name = workflowForm.name.trim()
    const trigger = workflowForm.trigger.trim()
    const action = workflowForm.action.trim()
    if (!name || !trigger || !action) return
    setWorkflows((prev) => [
      { id: `w-${Date.now()}`, name, trigger, action, active: true },
      ...prev,
    ])
    setWorkflowForm({ name: "", trigger: "", action: "" })
  }

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) => prev.map((wf) => (wf.id === id ? { ...wf, active: !wf.active } : wf)))
  }

  const updateApproval = (id: string, status: "approved" | "rejected") => {
    setApprovals((prev) => prev.map((ap) => (ap.id === id ? { ...ap, status } : ap)))
  }

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) => prev.map((intg) => (intg.id === id ? { ...intg, connected: !intg.connected } : intg)))
  }

  const applyInsight = (id: string) => {
    setInsights((prev) => prev.filter((ins) => ins.id !== id))
  }

  const saveReport = () => {
    if (!reportForm.name) return
    setReports((prev) => [
      {
        id: `r-${Date.now()}`,
        name: reportForm.name,
        dataset: reportForm.dataset,
        metrics: reportForm.metrics,
        groupBy: reportForm.groupBy,
        schedule: reportForm.schedule,
        notes: reportForm.notes,
        owner: reportForm.dataset,
        lastRun: "Not run yet",
      },
      ...prev,
    ])
    setReportForm({ name: "", dataset: "CRM", metrics: "Revenue", groupBy: "Month", schedule: "Monthly", notes: "" })
  }

  const runReport = (id: string) => {
    const timestamp = new Date().toLocaleString()
    setReports((prev) => prev.map((report) => (report.id === id ? { ...report, lastRun: timestamp } : report)))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Operations Hub</h1>
        <p className="text-muted-foreground">
          Workflows, approvals, integrations, AI insights, audit trails, and compliance in one place.
        </p>
      </div>

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Unified Timeline</CardTitle>
              <CardDescription>Everything that happens across Civis in one feed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {timeline.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Builder</CardTitle>
              <CardDescription>Create "if this then that" automations across modules.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              <Input
                placeholder="Workflow name"
                value={workflowForm.name}
                onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
              />
              <Input
                placeholder="Trigger (e.g., Invoice overdue)"
                value={workflowForm.trigger}
                onChange={(e) => setWorkflowForm({ ...workflowForm, trigger: e.target.value })}
              />
              <Input
                placeholder="Action (e.g., Send reminder)"
                value={workflowForm.action}
                onChange={(e) => setWorkflowForm({ ...workflowForm, action: e.target.value })}
              />
              <Button
                className="md:col-span-3 w-fit"
                onClick={addWorkflow}
                disabled={!workflowForm.name.trim() || !workflowForm.trigger.trim() || !workflowForm.action.trim()}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Workflow
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {workflows.map((wf) => (
              <Card key={wf.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{wf.name}</p>
                    <p className="text-sm text-muted-foreground">{wf.trigger} → {wf.action}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={wf.active ? "text-green-600" : "text-muted-foreground"}>
                      {wf.active ? "Active" : "Paused"}
                    </Badge>
                    <Switch checked={wf.active} onCheckedChange={() => toggleWorkflow(wf.id)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approvals</CardTitle>
              <CardDescription>Review and approve critical actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approvals.map((ap) => (
                <div key={ap.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{ap.request}</p>
                    <p className="text-sm text-muted-foreground">{ap.owner} • {ap.amount}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={approvalStatusStyles[ap.status]}>
                      {ap.status}
                    </Badge>
                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => updateApproval(ap.id, "approved")}>
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500/70 dark:text-red-300 dark:hover:bg-red-950/30"
                      onClick={() => updateApproval(ap.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {integrations.map((intg) => (
              <Card key={intg.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{intg.name}</p>
                    <p className="text-sm text-muted-foreground">{intg.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={intg.connected ? "text-green-600" : "text-muted-foreground"}>
                      {intg.connected ? "Connected" : "Not connected"}
                    </Badge>
                    <Button variant="outline" className="bg-transparent" onClick={() => toggleIntegration(intg.id)}>
                      {intg.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((ins) => (
              <Card key={ins.id}>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{ins.title}</p>
                    <p className="text-sm text-muted-foreground">{ins.reason}</p>
                    <Badge variant="outline" className="mt-2">{ins.impact}</Badge>
                  </div>
                  <Button size="sm" onClick={() => applyInsight(ins.id)}>
                    Apply
                  </Button>
                </CardContent>
              </Card>
            ))}
            {!insights.length && (
              <Card>
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  No new insights. Check back after more activity.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Builder</CardTitle>
              <CardDescription>Select data, metrics, and schedule delivery.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Report name"
                value={reportForm.name}
                onChange={(e) => setReportForm({ ...reportForm, name: e.target.value })}
              />
              <Input
                placeholder="Dataset (CRM, Accounting, HR)"
                value={reportForm.dataset}
                onChange={(e) => setReportForm({ ...reportForm, dataset: e.target.value })}
              />
              <Input
                placeholder="Metrics (Revenue, Pipeline)"
                value={reportForm.metrics}
                onChange={(e) => setReportForm({ ...reportForm, metrics: e.target.value })}
              />
              <Input
                placeholder="Group by (Month, Team)"
                value={reportForm.groupBy}
                onChange={(e) => setReportForm({ ...reportForm, groupBy: e.target.value })}
              />
              <Input
                placeholder="Schedule (Daily, Weekly, Monthly)"
                value={reportForm.schedule}
                onChange={(e) => setReportForm({ ...reportForm, schedule: e.target.value })}
              />
              <Textarea
                placeholder="Notes or filters..."
                value={reportForm.notes}
                onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
              />
              <Button className="w-fit" onClick={saveReport}>
                Save Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <CardDescription>Scheduled or on-demand reports.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.dataset || report.owner} • {report.metrics || "Metrics"} • {report.groupBy || "Group"} • {report.schedule}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Last run: {report.lastRun || "Not run yet"}</p>
                  </div>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => runReport(report.id)}>
                    Run
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>Track who changed what and when.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-muted-foreground">{log.actor}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">{log.time}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Security</CardTitle>
              <CardDescription>Operational safeguards and policy tracking.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {compliance.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                  <div className="flex items-center gap-2">
                    {item.status === "complete" ? <CheckSquare className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
