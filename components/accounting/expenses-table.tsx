"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X, Download, MoreHorizontal, Eye, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addApprovalRequest } from "@/lib/approvals"

export interface Expense {
  id: string
  description: string
  category: string
  amount: number
  date?: string
  status?: "approved" | "pending" | "rejected"
  submittedBy?: string
}

const categoryColors: Record<string, string> = {
  travel: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  office: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
  meals: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  software: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  utilities: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200",
  equipment: "bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200",
  other: "bg-gray-100 text-gray-800 dark:bg-slate-700/40 dark:text-slate-200",
}

const statusColors = {
  approved: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
}

const expenseCategories = ["travel", "office", "meals", "software", "other"]
const expenseOwners = ["John Smith", "Adaeze Okafor", "Finance Ops", "HR Team", "Civis Bot"]

const buildMockExpenses = (count: number): Expense[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `EXP-${(idx + 1).toString().padStart(3, "0")}`,
    description: `Expense ${idx + 1} - ${expenseCategories[idx % expenseCategories.length]}`,
    category: expenseCategories[idx % expenseCategories.length],
    amount: 45000 + (idx % 10) * 25000,
    date: new Date(2025, (idx % 12), (idx % 27) + 1).toISOString().slice(0, 10),
    status: idx % 3 === 0 ? "approved" : "pending",
    submittedBy: expenseOwners[idx % expenseOwners.length],
  }))

const mockExpenses: Expense[] = buildMockExpenses(70)

type Props = {
  searchQuery: string
  expenses?: Expense[]
  onAddExpense?: (data: Omit<Expense, "id">) => void
  onDeleteExpense?: (id: string) => void
  showAmounts?: boolean
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount * 805)

export function ExpensesTable({
  searchQuery,
  expenses: providedExpenses,
  onAddExpense,
  onDeleteExpense,
  showAmounts = true,
}: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(providedExpenses || mockExpenses)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    description: "",
    category: "travel",
    amount: "",
    date: "",
    submittedBy: "",
  })

  useEffect(() => {
    if (providedExpenses) setExpenses(providedExpenses)
  }, [providedExpenses])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedExpenses = [...filteredExpenses].sort((a, b) =>
    (b.date || "").localeCompare(a.date || ""),
  )

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedExpenses.length / PAGE_SIZE))
  const pagedExpenses = sortedExpenses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const stats = {
    approved: expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const existing = editingId ? expenses.find((exp) => exp.id === editingId) : undefined
    const payload: Omit<Expense, "id"> = {
      description: formData.description,
      category: formData.category,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      status: existing?.status || "pending",
      submittedBy: formData.submittedBy,
    }
    if (editingId) {
      setExpenses((prev) => prev.map((exp) => (exp.id === editingId ? { ...exp, ...payload } : exp)))
      setEditingId(null)
    } else if (onAddExpense) {
      onAddExpense(payload)
    } else {
      setExpenses((prev) => [...prev, { id: Date.now().toString(), ...payload }])
    }
    setFormData({
      description: "",
      category: "travel",
      amount: "",
      date: "",
      submittedBy: "",
    })
    setShowModal(false)
  }

  const handleDeleteExpense = (id: string) => {
    if (onDeleteExpense) {
      onDeleteExpense(id)
    } else {
      setExpenses(expenses.filter((exp) => exp.id !== id))
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingId(expense.id)
    setFormData({
      description: expense.description,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date || "",
      submittedBy: expense.submittedBy || "",
    })
    setShowModal(true)
  }

  const downloadExpensesCSV = () => {
    const headers = ["Description", "Category", "Amount", "Date", "Status", "Submitted By"]
    const rows = expenses.map((e) => [e.description, e.category, e.amount, e.date, e.status, e.submittedBy])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "expenses.csv"
    a.click()
  }

  const requestApproval = (expense: Expense) => {
    addApprovalRequest({
      request: `Expense: ${expense.description}`,
      owner: expense.submittedBy || "Finance",
      amount: formatNaira(expense.amount),
      module: "Accounting",
    })
    alert("Approval requested. Review it in Operations → Approvals.")
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-primary">{showAmounts ? formatNaira(stats.approved) : "••••"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold text-accent">{showAmounts ? formatNaira(stats.pending) : "••••"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expenses ({filteredExpenses.length})</CardTitle>
            <CardDescription>Track business spend and reimbursements</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadExpensesCSV}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.submittedBy || "—"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[expense.category] || "bg-gray-100 text-gray-800 dark:bg-slate-700/40 dark:text-slate-200"}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold">{showAmounts ? formatNaira(expense.amount) : "••••"}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[expense.status || "pending"]}>
                        {expense.status || "pending"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{expense.date || "—"}</td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(expense, null, 2))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditExpense(expense)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => requestApproval(expense)}>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Request approval
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Expense" : "Add New Expense"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Expense description"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="travel, office..."
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 50000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Submitted By</label>
                  <Input
                    value={formData.submittedBy}
                    onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
                    placeholder="Name"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Add Expense
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
