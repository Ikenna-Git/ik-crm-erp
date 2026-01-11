"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X, Download, Eye, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Invoice {
  id: string
  number: string
  client: string
  amount: number
  status: "draft" | "sent" | "paid" | "overdue"
  date?: string
  dueDate?: string
}

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    number: "INV-2025-001",
    client: "Acme Corp",
    amount: 12000,
    status: "paid",
    date: "2025-01-15",
    dueDate: "2025-02-15",
  },
]

type Props = {
  searchQuery: string
  invoices?: Invoice[]
  onAddInvoice?: (data: Omit<Invoice, "id">) => void
  onDeleteInvoice?: (id: string) => void
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount * 805)

export function InvoicesTable({ searchQuery, invoices: providedInvoices, onAddInvoice, onDeleteInvoice }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(providedInvoices || mockInvoices)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    number: "",
    client: "",
    amount: "",
    date: "",
    dueDate: "",
  })

  useEffect(() => {
    if (providedInvoices) setInvoices(providedInvoices)
  }, [providedInvoices])

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
    const payload: Omit<Invoice, "id"> = {
      number: formData.number,
      client: formData.client,
      amount: Number.parseFloat(formData.amount),
      status: "draft",
      date: formData.date,
      dueDate: formData.dueDate,
    }
    if (editingId) {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === editingId ? { ...inv, ...payload } : inv)),
      )
      setEditingId(null)
    } else if (onAddInvoice) {
      onAddInvoice(payload)
    } else {
      setInvoices((prev) => [...prev, { id: Date.now().toString(), ...payload }])
    }
    setFormData({ number: "", client: "", amount: "", date: "", dueDate: "" })
    setShowModal(false)
  }

  const handleDeleteInvoice = (id: string) => {
    if (onDeleteInvoice) {
      onDeleteInvoice(id)
    } else {
      setInvoices(invoices.filter((inv) => inv.id !== id))
    }
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingId(invoice.id)
    setFormData({
      number: invoice.number,
      client: invoice.client,
      amount: String(invoice.amount),
      date: invoice.date || "",
      dueDate: invoice.dueDate || "",
    })
    setShowModal(true)
  }

  const downloadInvoicesCSV = () => {
    const headers = ["Invoice", "Client", "Amount", "Status", "Due Date"]
    const rows = invoices.map((i) => [i.number, i.client, i.amount, i.status, i.dueDate])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "invoices.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(stats.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-accent">{formatNaira(stats.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{formatNaira(stats.overdue)}</p>
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
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex items-center gap-2 bg-transparent" onClick={downloadInvoicesCSV}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Invoice
            </Button>
          </div>
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
                    <td className="py-4 px-4 text-muted-foreground">{invoice.dueDate || "—"}</td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(invoice, null, 2))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadInvoicesCSV()}>
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteInvoice(invoice.id)}
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
        </CardContent>
      </Card>

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Invoice" : "Add New Invoice"}</CardTitle>
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
                    placeholder="INV-2025-001"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Client</label>
                  <Input
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    placeholder="Client name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Amount</label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., 500000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Invoice Date</label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
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
                    {editingId ? "Save Changes" : "Add Invoice"}
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
