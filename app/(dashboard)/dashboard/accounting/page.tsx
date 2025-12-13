"use client"

import { useEffect, useState } from "react"
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
import { InvoicesTable, type Invoice } from "@/components/accounting/invoices-table"
import { ExpensesTable, type Expense } from "@/components/accounting/expenses-table"
import { FinancialReports } from "@/components/accounting/financial-reports"

export default function AccountingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
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

  const loadData = async () => {
    try {
      setLoading(true)
      const [invRes, expRes] = await Promise.all([fetch("/api/accounting/invoices"), fetch("/api/accounting/expenses")])
      const invJson = await invRes.json()
      const expJson = await expRes.json()
      setInvoices(
        (invJson.invoices || []).map((i: any) => ({
          id: i.id,
          number: i.invoiceNumber,
          client: i.clientName,
          amount: i.amount,
          status: i.status,
          dueDate: i.dueDate,
        })),
      )
      setExpenses(
        (expJson.expenses || []).map((e: any) => ({
          id: e.id,
          description: e.description,
          category: e.category,
          amount: e.amount,
          date: e.date,
          status: "pending",
          submittedBy: "System",
        })),
      )
    } catch (err) {
      console.error("Failed to load accounting data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
      const data = await res.json()
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
      alert("Failed to add invoice")
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
      const data = await res.json()
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
        },
      ])
      setExpenseForm({ description: "", amount: "", category: "office-supplies", date: "" })
      setOpenExpenseDialog(false)
    } catch (err) {
      alert("Failed to add expense")
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices, expenses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <InvoicesTable searchQuery={searchQuery} invoices={invoices} />
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <ExpensesTable searchQuery={searchQuery} expenses={expenses} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <FinancialReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
