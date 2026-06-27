"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Download, Sparkles, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { Invoice } from "@/components/accounting/invoices-table"
import type { Expense } from "@/components/accounting/expenses-table"
import { SectionErrorBoundary } from "@/components/shared/section-error-boundary"
import { PrivacyLockPanel } from "@/components/shared/privacy-lock-panel"
import { getSessionHeaders } from "@/lib/user-settings"
import { formatNaira } from "@/lib/currency"
import { toast } from "@/hooks/use-toast"
import { hasModuleAccess } from "@/lib/access-control"
import { isAdmin } from "@/lib/authz"
import { requestJson, getApiErrorMessage } from "@/lib/api-client"

const sectionLoader = (label: string) => () => <div className="text-sm text-muted-foreground">Loading {label}...</div>

const InvoicesTable = dynamic(() => import("@/components/accounting/invoices-table").then((mod) => mod.InvoicesTable), {
  ssr: false,
  loading: sectionLoader("invoices"),
})

const ExpensesTable = dynamic(() => import("@/components/accounting/expenses-table").then((mod) => mod.ExpensesTable), {
  ssr: false,
  loading: sectionLoader("expenses"),
})

const FinancialReports = dynamic(
  () => import("@/components/accounting/financial-reports").then((mod) => mod.FinancialReports),
  {
    ssr: false,
    loading: sectionLoader("financial reports"),
  },
)

const invoiceClients = ["Acme Corp", "Northwind", "Globex", "Venture Labs", "Nimbus", "Zenith"]
const expenseCategories = ["utilities", "travel", "equipment", "software", "office", "meals"]
const expenseOwners = ["Finance Bot", "HR", "IT", "Ops", "Sales", "Admin"]

const buildFallbackInvoices = (count: number): Invoice[] =>
  Array.from({ length: count }, (_, idx) => {
    const statusOptions: Invoice["status"][] = ["draft", "sent", "paid", "overdue"]
    return {
      id: `INV-${(idx + 1).toString().padStart(3, "0")}`,
      number: `INV-2025-${(idx + 1).toString().padStart(3, "0")}`,
      client: invoiceClients[idx % invoiceClients.length],
      amount: 120000 + (idx % 8) * 65000,
      status: statusOptions[idx % statusOptions.length],
      dueDate: new Date(2025, (idx % 12), (idx % 27) + 1).toISOString().slice(0, 10),
      date: new Date(2025, (idx % 12), (idx % 27) + 1).toISOString().slice(0, 10),
    }
  })

const buildFallbackExpenses = (count: number): Expense[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `EXP-${(idx + 1).toString().padStart(3, "0")}`,
    description: `Expense ${idx + 1} - ${expenseCategories[idx % expenseCategories.length]}`,
    category: expenseCategories[idx % expenseCategories.length],
    amount: 45000 + (idx % 10) * 25000,
    date: new Date(2025, (idx % 12), (idx % 27) + 1).toISOString().slice(0, 10),
    status: "pending",
    submittedBy: expenseOwners[idx % expenseOwners.length],
  }))

const fallbackInvoices = buildFallbackInvoices(70)
const fallbackExpenses = buildFallbackExpenses(70)

const safeDateString = (value: unknown) => {
  if (!value) return undefined
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10)
}

const safeNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const safeString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback)

const reportPacks = [
  {
    id: "close-pack",
    title: "Month-end close pack",
    detail: "GL summary, AR/AP aging, expense ledger",
    cadence: "Monthly",
  },
  {
    id: "cashflow-pack",
    title: "Cash flow pulse",
    detail: "Revenue vs expenses, profit margin, burn rate",
    cadence: "Weekly",
  },
  {
    id: "compliance-pack",
    title: "Compliance bundle",
    detail: "VAT summary, PAYE schedule, statutory remittances",
    cadence: "Quarterly",
  },
]

export default function AccountingPage() {
  const { data: session } = useSession()
  const searchQuery = ""
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [crmCompanies, setCrmCompanies] = useState<Array<{ id: string; label: string }>>([])
  const [crmDeals, setCrmDeals] = useState<Array<{ id: string; label: string }>>([])
  const [projectOptions, setProjectOptions] = useState<Array<{ id: string; label: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [privacyUnlocked, setPrivacyUnlocked] = useState(false)
  const [privacyLoading, setPrivacyLoading] = useState(true)
  const [privacyConfigured, setPrivacyConfigured] = useState(true)
  const [privacyCanUnlock, setPrivacyCanUnlock] = useState(false)
  const [privacyMessage, setPrivacyMessage] = useState("Checking privacy state...")
  const [privacyError, setPrivacyError] = useState("")
  const [importNotice, setImportNotice] = useState("")
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    clientName: "",
    amount: "",
    dueDate: "",
    status: "draft",
  })

  const [openExpenseDialog, setOpenExpenseDialog] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "office-supplies",
    date: "",
  })
  const canManageAccounting = hasModuleAccess(session?.user || {}, "accounting", "manage")
  const canManageSensitiveAccounting = canManageAccounting || privacyCanUnlock
  const canUseSensitiveAccounting = canManageSensitiveAccounting && privacyUnlocked

  const splitCsvLine = (line: string) => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result.map((value) => value.trim())
  }

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (!lines.length) return []
    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line)
      const record: Record<string, string> = {}
      headers.forEach((header, idx) => {
        record[header] = values[idx] ?? ""
      })
      return record
    })
  }

  const parseNumber = (value: string) => {
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "")
    return Number.parseFloat(cleaned || "0")
  }

  const mapInvoice = (inv: any): Invoice => ({
    id: safeString(inv?.id, `invoice-${Date.now()}`),
    number: safeString(inv?.invoiceNumber, "Untitled invoice"),
    client: safeString(inv?.clientName, "Unknown client"),
    amount: safeNumber(inv?.amount),
    notes: safeString(inv?.notes),
    terms: safeString(inv?.terms),
    lineItems: Array.isArray(inv?.lineItems) ? inv.lineItems : [],
    relatedLinks: Array.isArray(inv?.relatedLinks) ? inv.relatedLinks : [],
    relatedRecords: inv?.relatedRecords && typeof inv.relatedRecords === "object" ? inv.relatedRecords : {},
    status: String(inv?.status || "DRAFT").toLowerCase() as Invoice["status"],
    approvalStatus:
      inv?.approvalStatus === "pending" || inv?.approvalStatus === "approved" || inv?.approvalStatus === "rejected"
        ? inv.approvalStatus
        : null,
    date: safeDateString(inv?.issueDate) || safeDateString(inv?.createdAt),
    dueDate: safeDateString(inv?.dueDate),
  })

  const mapExpense = (exp: any): Expense => ({
    id: safeString(exp?.id, `expense-${Date.now()}`),
    description: safeString(exp?.description, "Untitled expense"),
    category: safeString(exp?.category, "other"),
    amount: safeNumber(exp?.amount),
    date: safeDateString(exp?.date),
    status: String(exp?.status || "PENDING").toLowerCase() as Expense["status"],
    approvalStatus:
      exp?.approvalStatus === "pending" || exp?.approvalStatus === "approved" || exp?.approvalStatus === "rejected"
        ? exp.approvalStatus
        : null,
    submittedBy: safeString(exp?.submittedBy, "System"),
  })

  const downloadTemplate = (type: "invoices" | "expenses") => {
    const headers =
      type === "invoices"
        ? ["invoiceNumber", "clientName", "amount", "status", "dueDate"]
        : ["description", "amount", "category", "date"]
    const sample =
      type === "invoices"
        ? ["INV-2025-001", "Acme Corp", "120000", "sent", "2025-02-15"]
        : ["Cloud hosting", "85000", "utilities", "2025-01-10"]
    const csv = [headers.join(","), sample.join(",")].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = type === "invoices" ? "accounting-invoices-template.csv" : "accounting-expenses-template.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImportInvoices = async (file: File) => {
    const text = await file.text()
    const rows = parseCsv(text)
    if (!rows.length) return setImportNotice("No invoices found in file.")
    const mapped: Invoice[] = rows.map((row, idx) => ({
      id: `IMP-INV-${Date.now()}-${idx}`,
      number: row.invoicenumber || row.number || row.invoice || `INV-IMPORT-${idx + 1}`,
      client: row.clientname || row.client || "Imported Client",
      amount: parseNumber(row.amount),
      status: (row.status as Invoice["status"]) || "draft",
      dueDate: row.duedate || row.due || undefined,
      date: row.date || undefined,
    }))
    setInvoices((prev) => [...mapped, ...prev])
    setImportNotice(`Imported ${mapped.length} invoices.`)
  }

  const handleImportExpenses = async (file: File) => {
    const text = await file.text()
    const rows = parseCsv(text)
    if (!rows.length) return setImportNotice("No expenses found in file.")
    const mapped: Expense[] = rows.map((row, idx) => ({
      id: `IMP-EXP-${Date.now()}-${idx}`,
      description: row.description || "Imported expense",
      amount: parseNumber(row.amount),
      category: row.category || "general",
      date: row.date || undefined,
      status: "pending",
      submittedBy: "Import",
    }))
    setExpenses((prev) => [...mapped, ...prev])
    setImportNotice(`Imported ${mapped.length} expenses.`)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setImportNotice("")
      const headers = { ...getSessionHeaders() }
      const [invJson, expJson, companiesJson, dealsJson, projectsJson] = await Promise.all([
        requestJson<any>("/api/accounting/invoices", { headers }),
        requestJson<any>("/api/accounting/expenses", { headers }),
        requestJson<any>("/api/crm/companies", { headers }),
        requestJson<any>("/api/crm/deals", { headers }),
        requestJson<any>("/api/projects", { headers }),
      ])

      const mappedInvoices = Array.isArray(invJson?.invoices) ? invJson.invoices.map(mapInvoice) : []

      const mappedExpenses = Array.isArray(expJson?.expenses) ? expJson.expenses.map(mapExpense) : []

      setInvoices(mappedInvoices)
      setExpenses(mappedExpenses)
      setCrmCompanies(
        Array.isArray(companiesJson?.companies)
          ? companiesJson.companies.map((company: any) => ({ id: company.id, label: company.name || company.id }))
          : [],
      )
      setCrmDeals(
        Array.isArray(dealsJson?.deals)
          ? dealsJson.deals.map((deal: any) => ({ id: deal.id, label: deal.title || deal.id }))
          : [],
      )
      setProjectOptions(
        Array.isArray(projectsJson?.projects)
          ? projectsJson.projects.map((project: any) => ({ id: project.id, label: project.name || project.id }))
          : [],
      )
    } catch (err: any) {
      console.error("Failed to load accounting data", err)
      setError(getApiErrorMessage(err, "Failed to load accounting data"))
      setInvoices([])
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadPrivacyState = async () => {
    setPrivacyLoading(true)
    setPrivacyError("")
    try {
      const response = await requestJson<any>("/api/privacy-lock?module=accounting", { headers: { ...getSessionHeaders() } })
      setPrivacyUnlocked(Boolean(response.unlocked))
      setPrivacyConfigured(response.configured !== false)
      setPrivacyCanUnlock(Boolean(response.canUnlock))
      setPrivacyMessage(typeof response.message === "string" ? response.message : "Accounting privacy is locked for this session.")
      return response
    } catch (err: any) {
      setPrivacyUnlocked(false)
      setPrivacyConfigured(true)
      setPrivacyCanUnlock(false)
      setPrivacyMessage("Checking privacy state failed.")
      setPrivacyError(getApiErrorMessage(err, "Failed to load Accounting privacy state"))
      return null
    } finally {
      setPrivacyLoading(false)
    }
  }

  useEffect(() => {
    loadPrivacyState()
  }, [])

  const unlockPrivacy = async (pin: string) => {
    setPrivacyError("")
    setPrivacyLoading(true)
    try {
      await requestJson("/api/privacy-lock", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ module: "accounting", pin }),
      })
      await loadPrivacyState()
      await loadData()
    } catch (err: any) {
      setPrivacyError(getApiErrorMessage(err, "Failed to unlock Accounting privacy"))
    } finally {
      setPrivacyLoading(false)
    }
  }

  const lockPrivacyAgain = async () => {
    setPrivacyError("")
    setPrivacyLoading(true)
    try {
      await requestJson("/api/privacy-lock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ module: "accounting" }),
      })
      await loadPrivacyState()
      await loadData()
    } catch (err: any) {
      setPrivacyError(getApiErrorMessage(err, "Failed to relock Accounting privacy"))
    } finally {
      setPrivacyLoading(false)
    }
  }

  const createInvoice = async (payload: Omit<Invoice, "id">) => {
    try {
      setError("")
      const data = await requestJson<any>("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          invoiceNumber: payload.number,
          clientName: payload.client,
          amount: payload.amount,
          dueDate: payload.dueDate,
          issueDate: payload.date,
          status: payload.status,
          notes: payload.notes,
          terms: payload.terms,
          lineItems: payload.lineItems,
          relatedLinks: payload.relatedLinks,
          relatedRecords: payload.relatedRecords,
        }),
      })
      const mapped = mapInvoice(data.invoice)
      setInvoices((prev) => [mapped, ...prev])
      return mapped
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to add invoice"))
      return null
    }
  }

  const createExpense = async (payload: Omit<Expense, "id">) => {
    try {
      setError("")
      const data = await requestJson<any>("/api/accounting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          description: payload.description,
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          status: payload.status,
          submittedBy: payload.submittedBy,
        }),
      })
      const mapped = mapExpense(data.expense)
      setExpenses((prev) => [mapped, ...prev])
      return mapped
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to add expense"))
      return null
    }
  }

  const handleAddInvoice = async () => {
    if (!invoiceForm.invoiceNumber || !invoiceForm.amount) return
    await createInvoice({
      number: invoiceForm.invoiceNumber,
      client: invoiceForm.clientName || "Draft Client",
      amount: Number(invoiceForm.amount),
      status: invoiceForm.status as Invoice["status"],
      date: new Date().toISOString().slice(0, 10),
      dueDate: invoiceForm.dueDate,
    })
    setInvoiceForm({ invoiceNumber: "", clientName: "", amount: "", dueDate: "", status: "draft" })
    setOpenInvoiceDialog(false)
  }

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return
    await createExpense({
      description: expenseForm.description,
      amount: Number(expenseForm.amount),
      category: expenseForm.category,
      date: expenseForm.date,
      status: "pending",
      submittedBy: "You",
    })
    setExpenseForm({ description: "", amount: "", category: "office-supplies", date: "" })
    setOpenExpenseDialog(false)
  }

  const handleUpdateInvoice = async (id: string, data: Partial<Invoice>) => {
    try {
      setError("")
      const json = await requestJson<any>("/api/accounting/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          id,
          invoiceNumber: data.number,
          clientName: data.client,
          amount: data.amount,
          status: data.status,
          dueDate: data.dueDate,
          issueDate: data.date,
          notes: data.notes,
          terms: data.terms,
          lineItems: data.lineItems,
          relatedLinks: data.relatedLinks,
          relatedRecords: data.relatedRecords,
        }),
      })
      const updated = mapInvoice(json.invoice)
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)))
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to update invoice"))
    }
  }

  const handleDeleteInvoice = async (id: string) => {
    try {
      setError("")
      await requestJson(`/api/accounting/invoices?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      setInvoices((prev) => prev.filter((inv) => inv.id !== id))
    } catch (err: any) {
      console.warn("Failed to delete invoice", err)
      setError(getApiErrorMessage(err, "Failed to delete invoice"))
    }
  }

  const handleUpdateExpense = async (id: string, data: Partial<Expense>) => {
    try {
      setError("")
      const json = await requestJson<any>("/api/accounting/expenses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          id,
          description: data.description,
          amount: data.amount,
          category: data.category,
          date: data.date,
          status: data.status,
          submittedBy: data.submittedBy,
        }),
      })
      const updated = mapExpense(json.expense)
      setExpenses((prev) => prev.map((exp) => (exp.id === id ? updated : exp)))
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Failed to update expense"))
    }
  }

  const handleDeleteExpense = async (id: string) => {
    try {
      setError("")
      await requestJson(`/api/accounting/expenses?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      setExpenses((prev) => prev.filter((exp) => exp.id !== id))
    } catch (err: any) {
      console.warn("Failed to delete expense", err)
      setError(getApiErrorMessage(err, "Failed to delete expense"))
    }
  }

  const requestApproval = async (sourceType: "invoice" | "expense", sourceId: string) => {
    const data = await requestJson<any>("/api/ops/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      body: JSON.stringify({ sourceType, sourceId }),
    })
    return data?.approval || null
  }

  const handleRequestInvoiceApproval = async (invoice: Invoice) => {
    try {
      setError("")
      setImportNotice("")
      const approval = await requestApproval("invoice", invoice.id)
      setInvoices((prev) =>
        prev.map((item) =>
          item.id === invoice.id
            ? {
                ...item,
                approvalStatus: approval?.status || "pending",
              }
            : item,
        ),
      )
      setImportNotice(`Approval requested for ${invoice.number}. Review it in Operations → Approvals.`)
    } catch (err: any) {
      setError(err?.message || "Failed to request invoice approval")
    }
  }

  const handleRequestExpenseApproval = async (expense: Expense) => {
    try {
      setError("")
      setImportNotice("")
      const approval = await requestApproval("expense", expense.id)
      setExpenses((prev) =>
        prev.map((item) =>
          item.id === expense.id
            ? {
                ...item,
                approvalStatus: approval?.status || "pending",
                status: approval?.status === "approved" || approval?.status === "rejected" ? approval.status : item.status,
              }
            : item,
        ),
      )
      setImportNotice(`Approval requested for ${expense.description}. Review it in Operations → Approvals.`)
    } catch (err: any) {
      setError(err?.message || "Failed to request expense approval")
    }
  }

  const [exportEmail, setExportEmail] = useState("ikchils@gmail.com")
  const handleExportReports = async (target: "desktop" | "email") => {
    try {
      if (target === "desktop") {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ type: "accounting", target: "desktop" }),
      })
        if (!res.ok) throw new Error("Failed to export")
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "accounting-report.csv"
        link.click()
        window.URL.revokeObjectURL(url)
        return
      }

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ type: "accounting", target: "email", email: exportEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Accounting export failed",
          description: data.error || "Failed to send email",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Accounting report queued",
        description: data.message || "Report sent",
      })
    } catch (err) {
      toast({
        title: "Accounting export failed",
        description: "Export failed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleExportCompliance = async (type: "vat" | "audit", target: "desktop" | "email") => {
    try {
      if (target === "desktop") {
        const res = await fetch("/api/reports/export", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({ type, target: "desktop" }),
        })
        if (!res.ok) throw new Error("Failed to export")
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${type}-report.csv`
        link.click()
        window.URL.revokeObjectURL(url)
        return
      }

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ type, target: "email", email: exportEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Compliance export failed",
          description: data.error || "Failed to send email",
          variant: "destructive",
        })
        return
      }
      toast({
        title: "Compliance report queued",
        description: data.message || "Report sent",
      })
    } catch (err) {
      toast({
        title: "Compliance export failed",
        description: "Export failed. Please try again.",
        variant: "destructive",
      })
    }
  }

  const vatRate = 0.075
  const vatTaxable = invoices
    .filter((inv) => ["paid", "sent", "overdue"].includes(inv.status))
    .reduce((sum, inv) => sum + (inv.amount || 0), 0)
  const vatDue = Math.round(vatTaxable * vatRate)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-ai-anchor="accounting-header">
            Accounting
          </h1>
          <p className="text-muted-foreground mt-1">Manage invoices, expenses, and financial reports</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
          {error ? <p className="text-xs text-destructive mt-1">{error}</p> : null}
          {importNotice ? <p className="text-xs text-primary mt-1">{importNotice}</p> : null}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled={!canUseSensitiveAccounting}>
                <Download className="w-4 h-4" />
                Export Reports
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export accounting reports</DialogTitle>
                <DialogDescription>Choose where to send your CSV files.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="export-email">Email</Label>
                  <Input
                    id="export-email"
                    type="email"
                    value={exportEmail}
                    onChange={(e) => setExportEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="flex-1" onClick={() => handleExportReports("desktop")} disabled={!canUseSensitiveAccounting}>
                    Export to desktop (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleExportReports("email")}
                    disabled={!canUseSensitiveAccounting}
                  >
                    Email CSV report
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Exports are generated from your live accounting data.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openExpenseDialog} onOpenChange={setOpenExpenseDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent" disabled={!canUseSensitiveAccounting}>
                <Plus className="w-4 h-4" />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
                <DialogDescription>Record a new business expense</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-desc">Description</Label>
                  <Input
                    id="exp-desc"
                    placeholder="e.g., Office supplies purchase"
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Amount</Label>
                  <Input
                    id="exp-amount"
                    type="number"
                    placeholder="e.g., 50,000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-category">Category</Label>
                  <Select
                    value={expenseForm.category}
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="office-supplies">Office Supplies</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="meals">Meals & Entertainment</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-date">Date</Label>
                  <Input
                    id="exp-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddExpense} className="w-full">
                  Add Expense
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openInvoiceDialog} onOpenChange={setOpenInvoiceDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2" disabled={!canUseSensitiveAccounting}>
                <Plus className="w-4 h-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Add a new invoice to your records</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inv-number">Invoice Number</Label>
                  <Input
                    id="inv-number"
                    placeholder="e.g., INV-001"
                    value={invoiceForm.invoiceNumber}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Client Name</Label>
                  <Input
                    id="client"
                    placeholder="e.g., Acme Corp"
                    value={invoiceForm.clientName}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-amount">Amount</Label>
                  <Input
                    id="inv-amount"
                    type="number"
                    placeholder="e.g., 500,000"
                    value={invoiceForm.amount}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inv-status">Status</Label>
                  <Select
                    value={invoiceForm.status}
                    onValueChange={(value) => setInvoiceForm({ ...invoiceForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddInvoice} className="w-full">
                  Create Invoice
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Finance Pulse */}
      <div className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Finance Pulse</p>
            <p className="text-sm text-muted-foreground">Monitor invoices, expenses, and cash flow.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Invoices: {invoices.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Expenses: {expenses.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Overdue: {invoices.filter((inv) => inv.status === "overdue").length}
          </span>
        </div>
      </div>

      <PrivacyLockPanel
        title="Accounting privacy locked"
        inputLabel="Enter Accounting privacy PIN"
        unlockButtonLabel="Unlock Accounting"
        lockAgainButtonLabel="Lock Accounting again"
        unlocked={privacyUnlocked}
        canUnlock={privacyCanUnlock}
        loading={privacyLoading}
        configured={privacyConfigured}
        error={privacyError}
        helperText="Invoice, expense, approval, and export details are protected until Accounting privacy is unlocked for this session."
        statusMessage={privacyMessage}
        unlockedDescription="Accounting unlocked for this session. Invoice, expense, approval, and export details are visible again for authorized users."
        cannotUnlockMessage="Your role cannot unlock this privacy lock."
        notConfiguredMessage={
          isAdmin(session?.user?.role)
            ? "Accounting privacy PIN is not configured for this organisation."
            : "Accounting privacy PIN is not configured for this organisation. Ask an organisation owner/admin to set it in Workspace Admin Center → Privacy Locks."
        }
        notConfiguredActionHref={isAdmin(session?.user?.role) ? "/dashboard/admin#privacy-locks" : undefined}
        notConfiguredActionLabel={isAdmin(session?.user?.role) ? "Set Accounting privacy PIN" : undefined}
        loadingMessage="Checking privacy state..."
        onUnlock={unlockPrivacy}
        onLockAgain={lockPrivacyAgain}
      />

      {/* Finance Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Accounting Access
          </CardTitle>
          <CardDescription>Sensitive amounts, detail views, exports, and record mutations are controlled by workspace role.</CardDescription>
        </CardHeader>
        <CardContent>
          {canUseSensitiveAccounting ? (
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              Accounting privacy is unlocked for this session. Financial amounts, approvals, exports, and row actions are visible again.
            </div>
          ) : canManageSensitiveAccounting ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
              This role can manage accounting, but Accounting privacy is still locked. Unlock Accounting privacy before viewing finance totals, exports, approvals, or row actions.
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-4 text-sm text-muted-foreground">
              This role can open the accounting workspace shell, but financial amounts, exports, approvals, and record
              details remain redacted until a finance manager or workspace admin grants manage access.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <SectionErrorBoundary title="Invoices">
            <InvoicesTable
              searchQuery={searchQuery}
              invoices={invoices}
              crmCompanies={crmCompanies}
              crmDeals={crmDeals}
              projects={projectOptions}
              showAmounts={canUseSensitiveAccounting}
              onAddInvoice={createInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onRequestApproval={handleRequestInvoiceApproval}
              canManage={canManageAccounting}
              privacyUnlocked={privacyUnlocked}
            />
          </SectionErrorBoundary>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <SectionErrorBoundary title="Expenses">
            <ExpensesTable
              searchQuery={searchQuery}
              expenses={expenses}
              showAmounts={canUseSensitiveAccounting}
              onAddExpense={createExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
              onRequestApproval={handleRequestExpenseApproval}
              canManage={canManageAccounting}
              privacyUnlocked={privacyUnlocked}
            />
          </SectionErrorBoundary>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <SectionErrorBoundary title="Financial reports">
            <FinancialReports />
          </SectionErrorBoundary>
          <SectionErrorBoundary title="Report packs">
            <Card>
              <CardHeader>
                <CardTitle>Report Packs</CardTitle>
                <CardDescription>Curated bundles for finance, leadership, and compliance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportPacks.map((pack) => (
                  <div key={pack.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{pack.title}</p>
                      <p className="text-sm text-muted-foreground">{pack.detail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pack.cadence} cadence</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleExportReports("desktop")} disabled={!canUseSensitiveAccounting}>
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => handleExportReports("email")}
                        disabled={!canUseSensitiveAccounting}
                      >
                        Send Email
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Compliance pack">
            <Card>
              <CardHeader>
                <CardTitle>Regional Compliance Pack (NGN)</CardTitle>
                <CardDescription>VAT presets and audit-ready exports for regulators.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="font-medium">VAT Snapshot</p>
                    <p className="text-sm text-muted-foreground">7.5% VAT on taxable revenue.</p>
                    <div className="text-sm">
                      <p>Taxable revenue: {canUseSensitiveAccounting ? formatNaira(vatTaxable) : "Restricted"}</p>
                      <p>VAT due: {canUseSensitiveAccounting ? formatNaira(vatDue) : "Restricted"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => handleExportCompliance("vat", "desktop")} disabled={!canUseSensitiveAccounting}>
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => handleExportCompliance("vat", "email")}
                        disabled={!canUseSensitiveAccounting}
                      >
                        Email VAT CSV
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border p-4 space-y-2">
                    <p className="font-medium">Audit-ready exports</p>
                    <p className="text-sm text-muted-foreground">
                      Pull action logs, approval trails, and edits for compliance review.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button size="sm" onClick={() => handleExportCompliance("audit", "desktop")} disabled={!canUseSensitiveAccounting}>
                        Export audit log
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-transparent"
                        onClick={() => handleExportCompliance("audit", "email")}
                        disabled={!canUseSensitiveAccounting}
                      >
                        Email audit log
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SectionErrorBoundary>
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Upload CSV files using the templates below.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {importNotice ? <div className="text-sm text-primary">{importNotice}</div> : null}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3 border border-border rounded-lg p-4">
                  <div>
                    <p className="font-medium">Invoices CSV</p>
                    <p className="text-sm text-muted-foreground">Use the template to match required columns.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-transparent w-full"
                    onClick={() => downloadTemplate("invoices")}
                    disabled={!canUseSensitiveAccounting}
                  >
                    Download invoice template
                  </Button>
                  <Input
                    type="file"
                    accept=".csv"
                    disabled={!canUseSensitiveAccounting}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImportInvoices(file)
                    }}
                  />
                </div>
                <div className="space-y-3 border border-border rounded-lg p-4">
                  <div>
                    <p className="font-medium">Expenses CSV</p>
                    <p className="text-sm text-muted-foreground">Use the template to match required columns.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="bg-transparent w-full"
                    onClick={() => downloadTemplate("expenses")}
                    disabled={!canUseSensitiveAccounting}
                  >
                    Download expenses template
                  </Button>
                  <Input
                    type="file"
                    accept=".csv"
                    disabled={!canUseSensitiveAccounting}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImportExpenses(file)
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
