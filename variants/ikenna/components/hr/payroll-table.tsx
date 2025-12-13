"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, EyeOff, Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatNaira } from "@/lib/currency"

interface PayrollRecord {
  id: string
  employee: string
  period: string
  baseSalary: number
  bonus: number
  deductions: number
  netPay: number
  status: "pending" | "processed" | "paid"
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processed: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
}

const mockPayroll: PayrollRecord[] = [
  {
    id: "1",
    employee: "Sarah Johnson",
    period: "January 2025",
    baseSalary: 125000,
    bonus: 5000,
    deductions: 18750,
    netPay: 111250,
    status: "paid",
  },
  {
    id: "2",
    employee: "Michael Chen",
    period: "January 2025",
    baseSalary: 95000,
    bonus: 3000,
    deductions: 14250,
    netPay: 83750,
    status: "paid",
  },
  {
    id: "3",
    employee: "Emma Davis",
    period: "January 2025",
    baseSalary: 85000,
    bonus: 2000,
    deductions: 12750,
    netPay: 74250,
    status: "processed",
  },
  {
    id: "4",
    employee: "John Smith",
    period: "January 2025",
    baseSalary: 110000,
    bonus: 0,
    deductions: 16500,
    netPay: 93500,
    status: "pending",
  },
]

export function PayrollTable({ searchQuery }: { searchQuery: string }) {
  const [payroll, setPayroll] = useState<PayrollRecord[]>(mockPayroll)
  const [showAmounts, setShowAmounts] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    employee: "",
    period: "",
    baseSalary: "",
    bonus: "",
    deductions: "",
  })

  const filteredPayroll = payroll.filter(
    (record) =>
      record.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.period.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    pending: filteredPayroll.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.netPay, 0),
    paid: filteredPayroll.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.netPay, 0),
    total: filteredPayroll.reduce((sum, p) => sum + p.netPay, 0),
  }

  const handleAddPayroll = (e: React.FormEvent) => {
    e.preventDefault()
    const baseSalary = Number.parseFloat(formData.baseSalary)
    const bonus = Number.parseFloat(formData.bonus) || 0
    const deductions = Number.parseFloat(formData.deductions)
    const netPay = baseSalary + bonus - deductions

    const newRecord: PayrollRecord = {
      id: Date.now().toString(),
      employee: formData.employee,
      period: formData.period,
      baseSalary,
      bonus,
      deductions,
      netPay,
      status: "pending",
    }
    setPayroll([...payroll, newRecord])
    setFormData({ employee: "", period: "", baseSalary: "", bonus: "", deductions: "" })
    setShowModal(false)
  }

  const downloadPayrollCSV = () => {
    const headers = ["Employee", "Period", "Base Salary", "Bonus", "Deductions", "Net Pay", "Status"]
    const rows = payroll.map((p) => [p.employee, p.period, p.baseSalary, p.bonus, p.deductions, p.netPay, p.status])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payroll.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Payroll</p>
            <p className="text-2xl font-bold">{showAmounts ? formatNaira(stats.total, true) : "****"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {showAmounts ? formatNaira(stats.pending, true) : "****"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{showAmounts ? formatNaira(stats.paid, true) : "****"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payroll Records ({filteredPayroll.length})</CardTitle>
            <CardDescription>Manage payroll and salary information</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAmounts(!showAmounts)}
              className="flex items-center gap-2"
            >
              {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAmounts ? "Hide" : "Show"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadPayrollCSV}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Payroll
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Period</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Base Salary</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Bonus</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deductions</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Net Pay</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayroll.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-medium">{record.employee}</td>
                    <td className="py-4 px-4">{record.period}</td>
                    <td className="py-4 px-4">{showAmounts ? formatNaira(record.baseSalary, true) : "****"}</td>
                    <td className="py-4 px-4">{showAmounts ? formatNaira(record.bonus, true) : "****"}</td>
                    <td className="py-4 px-4">{showAmounts ? formatNaira(record.deductions, true) : "****"}</td>
                    <td className="py-4 px-4 font-semibold text-primary">
                      {showAmounts ? formatNaira(record.netPay, true) : "****"}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Add New Payroll</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPayroll} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Employee Name</label>
                  <Input
                    value={formData.employee}
                    onChange={(e) => setFormData({ ...formData, employee: e.target.value })}
                    placeholder="Employee name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Period</label>
                  <Input
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="e.g., January 2025"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Base Salary (₦)</label>
                  <Input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: e.target.value })}
                    placeholder="100000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Bonus (₦)</label>
                  <Input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deductions (₦)</label>
                  <Input
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                    placeholder="15000"
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
                    Add Payroll
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
