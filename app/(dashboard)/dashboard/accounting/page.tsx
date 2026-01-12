"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Download, Sparkles, Lock, Unlock } from "lucide-react"
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
import { InvoicesTable, type Invoice } from "@/components/accounting/invoices-table"
import { ExpensesTable, type Expense } from "@/components/accounting/expenses-table"
import { FinancialReports } from "@/components/accounting/financial-reports"

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

export default function AccountingPage() {
  const searchQuery = ""
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [importNotice, setImportNotice] = useState("")
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false)
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    clientName: "",
    amount: "",
    dueDate: "",
    status: "draft",
  })

  const [financeUnlocked, setFinanceUnlocked] = useState(false)
  const [financeCode, setFinanceCode] = useState("2468")
  const [financeInput, setFinanceInput] = useState("")
  const [financeNotice, setFinanceNotice] = useState("")
  const [financeError, setFinanceError] = useState("")

  const [openExpenseDialog, setOpenExpenseDialog] = useState(false)
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "office-supplies",
    date: "",
  })

  const parseJsonSafe = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`)
    }
  }

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
      const [invRes, expRes] = await Promise.all([fetch("/api/accounting/invoices"), fetch("/api/accounting/expenses")])
      const invJson = invRes.ok ? await parseJsonSafe(invRes) : null
      const expJson = expRes.ok ? await parseJsonSafe(expRes) : null

      const mappedInvoices =
        invJson?.invoices?.length > 0
          ? invJson.invoices.map((i: any) => ({
              id: i.id,
              number: i.invoiceNumber,
              client: i.clientName,
              amount: i.amount,
              status: i.status,
              dueDate: i.dueDate,
            }))
          : fallbackInvoices

      const mappedExpenses =
        expJson?.expenses?.length > 0
          ? expJson.expenses.map((e: any) => ({
              id: e.id,
              description: e.description,
              category: e.category,
              amount: e.amount,
              date: e.date,
              status: e.status || "pending",
              submittedBy: e.submittedBy || "System",
            }))
          : fallbackExpenses

      setInvoices(mappedInvoices)
      setExpenses(mappedExpenses)
    } catch (err) {
      console.error("Failed to load accounting data", err)
      setInvoices(fallbackInvoices)
      setExpenses(fallbackExpenses)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("civis_finance_access_code")
    if (stored) {
      setFinanceCode(stored)
    } else {
      localStorage.setItem("civis_finance_access_code", "2468")
    }
  }, [])

  const unlockFinance = () => {
    if (financeInput.trim() !== financeCode) {
      setFinanceError("Invalid access code.")
      setFinanceNotice("")
      return
    }
    setFinanceUnlocked(true)
    setFinanceInput("")
    setFinanceError("")
    setFinanceNotice("Finance view unlocked.")
  }

  const lockFinance = () => {
    setFinanceUnlocked(false)
    setFinanceError("")
    setFinanceNotice("Finance view locked.")
  }

  const handleAddInvoice = async () => {
    if (!invoiceForm.invoiceNumber || !invoiceForm.amount) return
    try {
      const res = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber: invoiceForm.invoiceNumber,
          clientName: invoiceForm.clientName,
          amount: Number(invoiceForm.amount),
          dueDate: invoiceForm.dueDate,
          status: invoiceForm.status,
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data.error || "Failed to add invoice")
      setInvoices((prev) => [
        ...prev,
        {
          id: data.invoice.id,
          number: data.invoice.invoiceNumber,
          client: data.invoice.clientName,
          amount: data.invoice.amount,
          status: data.invoice.status,
          dueDate: data.invoice.dueDate,
        },
      ])
      setInvoiceForm({ invoiceNumber: "", clientName: "", amount: "", dueDate: "", status: "draft" })
      setOpenInvoiceDialog(false)
    } catch (err) {
      const localInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        number: invoiceForm.invoiceNumber,
        client: invoiceForm.clientName || "Draft Client",
        amount: Number(invoiceForm.amount),
        status: invoiceForm.status as Invoice["status"],
        dueDate: invoiceForm.dueDate || new Date().toISOString().slice(0, 10),
      }
      setInvoices((prev) => [...prev, localInvoice])
      setInvoiceForm({ invoiceNumber: "", clientName: "", amount: "", dueDate: "", status: "draft" })
      setOpenInvoiceDialog(false)
    }
  }

  const handleAddExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return
    try {
      const res = await fetch("/api/accounting/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: expenseForm.description,
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
          date: expenseForm.date,
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data.error || "Failed to add expense")
      setExpenses((prev) => [
        ...prev,
        {
          id: data.expense.id,
          description: data.expense.description,
          category: data.expense.category,
          amount: data.expense.amount,
          date: data.expense.date,
          status: "pending",
          submittedBy: data.expense.submittedBy || "You",
        },
      ])
      setExpenseForm({ description: "", amount: "", category: "office-supplies", date: "" })
      setOpenExpenseDialog(false)
    } catch (err) {
      const localExpense: Expense = {
        id: `EXP-${Date.now()}`,
        description: expenseForm.description,
        category: expenseForm.category as Expense["category"],
        amount: Number(expenseForm.amount),
        date: expenseForm.date || new Date().toISOString().slice(0, 10),
        status: "pending",
        submittedBy: "You",
      }
      setExpenses((prev) => [...prev, localExpense])
      setExpenseForm({ description: "", amount: "", category: "office-supplies", date: "" })
      setOpenExpenseDialog(false)
    }
  }

  const [exportEmail, setExportEmail] = useState("ikchils@gmail.com")
  const handleExportReports = async (target: "desktop" | "email") => {
    try {
      if (target === "desktop") {
        const res = await fetch("/api/reports/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "accounting", target: "email", email: exportEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || "Failed to send email")
        return
      }
      alert(data.message || "Report sent")
    } catch (err) {
      alert("Export failed. Please try again.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounting</h1>
          <p className="text-muted-foreground mt-1">Manage invoices, expenses, and financial reports</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
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
                  <Button className="flex-1" onClick={() => handleExportReports("desktop")}>
                    Export to desktop (CSV)
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => handleExportReports("email")}>
                    Email CSV report
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo only—wire to backend to generate and send real exports.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openExpenseDialog} onOpenChange={setOpenExpenseDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
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
              <Button className="flex items-center gap-2">
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

      {/* Finance Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Finance Privacy Lock
          </CardTitle>
          <CardDescription>Protect financial amounts from casual viewing.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <Label htmlFor="finance-code">Access code</Label>
            <Input
              id="finance-code"
              type="password"
              placeholder="Enter access code"
              value={financeInput}
              onChange={(e) => setFinanceInput(e.target.value)}
              className="max-w-xs"
            />
            {financeError ? <p className="text-xs text-destructive">{financeError}</p> : null}
            {financeNotice ? <p className="text-xs text-primary">{financeNotice}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={unlockFinance} className="flex items-center gap-2">
              <Unlock className="w-4 h-4" />
              Unlock amounts
            </Button>
            <Button variant="outline" className="bg-transparent" onClick={lockFinance}>
              Lock view
            </Button>
          </div>
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
          <InvoicesTable searchQuery={searchQuery} invoices={invoices} showAmounts={financeUnlocked} />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTable searchQuery={searchQuery} expenses={expenses} showAmounts={financeUnlocked} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
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
                  <Button variant="outline" className="bg-transparent w-full" onClick={() => downloadTemplate("invoices")}>
                    Download invoice template
                  </Button>
                  <Input
                    type="file"
                    accept=".csv"
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
                  <Button variant="outline" className="bg-transparent w-full" onClick={() => downloadTemplate("expenses")}>
                    Download expenses template
                  </Button>
                  <Input
                    type="file"
                    accept=".csv"
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
