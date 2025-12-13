"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X, Download } from "lucide-react"
import { Input } from "@/components/ui/input"

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
  travel: "bg-blue-100 text-blue-800",
  office: "bg-purple-100 text-purple-800",
  meals: "bg-orange-100 text-orange-800",
  software: "bg-green-100 text-green-800",
  other: "bg-gray-100 text-gray-800",
}

const statusColors = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
}

const mockExpenses: Expense[] = [
  {
    id: "1",
    description: "Flight to Lagos",
    category: "travel",
    amount: 450000,
    date: "2025-01-20",
    status: "approved",
    submittedBy: "John Smith",
  },
]

type Props = {
  searchQuery: string
  expenses?: Expense[]
  onAddExpense?: (data: Omit<Expense, "id">) => void
  onDeleteExpense?: (id: string) => void
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount * 805)

export function ExpensesTable({ searchQuery, expenses: providedExpenses, onAddExpense, onDeleteExpense }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(providedExpenses || mockExpenses)
  const [showModal, setShowModal] = useState(false)
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

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.category || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    approved: expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Omit<Expense, "id"> = {
      description: formData.description,
      category: formData.category,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      status: "pending",
      submittedBy: formData.submittedBy,
    }
    if (onAddExpense) {
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

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(stats.approved)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="text-2xl font-bold text-accent">{formatNaira(stats.pending)}</p>
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
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.submittedBy || "—"}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${categoryColors[expense.category] || "bg-gray-100 text-gray-800"}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold">{formatNaira(expense.amount)}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[expense.status || "pending"]}>
                        {expense.status || "pending"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{expense.date || "—"}</td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Add New Expense</CardTitle>
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
