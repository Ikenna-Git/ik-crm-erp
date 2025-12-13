"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, Trash2, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatNaira } from "@/lib/currency"

interface Invoice {
  id: string
  number: string
  client: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  date: string
  dueDate: string
}

const statusColors = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2025-001",
    client: "Tech Solutions Inc",
    amount: 5500,
    status: "paid",
    date: "2025-01-15",
    dueDate: "2025-02-15",
  },
  {
    id: "2",
    number: "INV-2025-002",
    client: "StartUp Labs",
    amount: 3200,
    status: "sent",
    date: "2025-01-20",
    dueDate: "2025-02-20",
  },
  {
    id: "3",
    number: "INV-2025-003",
    client: "Enterprise Corp",
    amount: 8750,
    status: "overdue",
    date: "2024-12-15",
    dueDate: "2025-01-15",
  },
  {
    id: "4",
    number: "INV-2025-004",
    client: "Global Industries",
    amount: 4200,
    status: "draft",
    date: "2025-01-25",
    dueDate: "2025-02-25",
  },
]

export function InvoicesTable({ searchQuery }: { searchQuery: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    number: "",
    client: "",
    amount: "",
    date: "",
    dueDate: "",
  })

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    paid: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pending: invoices.filter((i) => i.status === "sent").reduce((sum, i) => sum + i.amount, 0),
    overdue: invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
  }

  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault()
    const newInvoice: Invoice = {
      id: Date.now().toString(),
      number: formData.number,
      client: formData.client,
      amount: Number.parseFloat(formData.amount),
      status: "draft",
      date: formData.date,
      dueDate: formData.dueDate,
    }
    setInvoices([...invoices, newInvoice])
    setFormData({ number: "", client: "", amount: "", date: "", dueDate: "" })
    setShowModal(false)
  }

  const handleDeleteInvoice = (id: string) => {
    setInvoices(invoices.filter((inv) => inv.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(stats.paid, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-accent">{formatNaira(stats.pending, true)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{formatNaira(stats.overdue, true)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
            <CardDescription>All customer invoices and billing records</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Invoice
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Invoice</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-medium">{invoice.number}</td>
                    <td className="py-4 px-4">{invoice.client}</td>
                    <td className="py-4 px-4 font-semibold">{formatNaira(invoice.amount)}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[invoice.status]}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{invoice.dueDate}</td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteInvoice(invoice.id)}
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

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Add New Invoice</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="INV-2025-005"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Client Name</label>
                  <Input
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Client name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₦)</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
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
                    Add Invoice
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
