"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Eye, EyeOff, Plus, X, MoreHorizontal, Edit, Trash2, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { formatNaira } from "@/lib/currency"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addApprovalRequest } from "@/lib/approvals"

export interface PayrollRecord {
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
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  processed: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  paid: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
}

const payrollNames = [
  "Sarah Johnson",
  "Michael Chen",
  "Emma Davis",
  "John Smith",
  "Lisa Anderson",
  "Daniel Brown",
  "Grace Martins",
  "Ava Williams",
  "Noah Okafor",
  "Olivia Umeh",
]

const payrollPeriods = [
  "January 2025",
  "February 2025",
  "March 2025",
  "April 2025",
  "May 2025",
  "June 2025",
  "July 2025",
]

const buildMockPayroll = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const baseSalary = 70000 + (idx % 12) * 6500
    const bonus = idx % 3 === 0 ? 4500 : 0
    const deductions = Math.round(baseSalary * 0.12)
    const netPay = baseSalary + bonus - deductions
    const statusOptions: PayrollRecord["status"][] = ["pending", "processed", "paid"]
    return {
      id: `PAY-${(idx + 1).toString().padStart(3, "0")}`,
      employee: payrollNames[idx % payrollNames.length],
      period: payrollPeriods[idx % payrollPeriods.length],
      baseSalary,
      bonus,
      deductions,
      netPay,
      status: statusOptions[idx % statusOptions.length],
    }
  })

export const mockPayroll: PayrollRecord[] = buildMockPayroll(70)

type PayrollTableProps = {
  searchQuery: string
  payroll?: PayrollRecord[]
  onAddPayroll?: (data: Omit<PayrollRecord, "id">) => void
  onUpdatePayroll?: (id: string, data: Omit<PayrollRecord, "id">) => void
  onDeletePayroll?: (id: string) => void
}

export function PayrollTable({
  searchQuery,
  payroll: providedPayroll,
  onAddPayroll,
  onUpdatePayroll,
  onDeletePayroll,
}: PayrollTableProps) {
  const [payroll, setPayroll] = useState<PayrollRecord[]>(providedPayroll || mockPayroll)
  const [currentPage, setCurrentPage] = useState(1)
  const [showAmounts, setShowAmounts] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [accessCode, setAccessCode] = useState("1234")
  const [accessInput, setAccessInput] = useState("")
  const [accessError, setAccessError] = useState("")
  const [accessNotice, setAccessNotice] = useState("")
  const [newAccessCode, setNewAccessCode] = useState("")
  const [confirmAccessCode, setConfirmAccessCode] = useState("")
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

  const parsePeriod = (period: string) => {
    const parsed = Date.parse(`${period} 01`)
    return Number.isNaN(parsed) ? 0 : parsed
  }

  const sortedPayroll = [...filteredPayroll].sort((a, b) => parsePeriod(b.period) - parsePeriod(a.period))

  const stats = {
    pending: filteredPayroll.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.netPay, 0),
    paid: filteredPayroll.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.netPay, 0),
    total: filteredPayroll.reduce((sum, p) => sum + p.netPay, 0),
  }

  const displayAmounts = isUnlocked && showAmounts

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedPayroll.length / PAGE_SIZE))
  const pagedPayroll = sortedPayroll.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("civis_payroll_access_code")
    if (stored) {
      setAccessCode(stored)
    } else {
      localStorage.setItem("civis_payroll_access_code", "1234")
    }
    setShowAmounts(false)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    if (providedPayroll) setPayroll(providedPayroll)
  }, [providedPayroll])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleAddPayroll = (e: React.FormEvent) => {
    e.preventDefault()
    const baseSalary = Number.parseFloat(formData.baseSalary)
    const bonus = Number.parseFloat(formData.bonus) || 0
    const deductions = Number.parseFloat(formData.deductions)
    const netPay = baseSalary + bonus - deductions

    const newRecord: Omit<PayrollRecord, "id"> = {
      employee: formData.employee,
      period: formData.period,
      baseSalary,
      bonus,
      deductions,
      netPay,
      status: "pending",
    }
    if (editingId) {
      if (onUpdatePayroll) {
        onUpdatePayroll(editingId, newRecord)
      } else {
        setPayroll((prev) =>
          prev.map((p) => (p.id === editingId ? { id: editingId, ...newRecord } : p)),
        )
      }
      setEditingId(null)
    } else {
      if (onAddPayroll) {
        onAddPayroll(newRecord)
      } else {
        setPayroll((prev) => [...prev, { id: Date.now().toString(), ...newRecord }])
      }
    }
    setFormData({ employee: "", period: "", baseSalary: "", bonus: "", deductions: "" })
    setShowModal(false)
  }

  const handleEditPayroll = (record: PayrollRecord) => {
    if (!isUnlocked) return
    setEditingId(record.id)
    setFormData({
      employee: record.employee,
      period: record.period,
      baseSalary: String(record.baseSalary),
      bonus: String(record.bonus),
      deductions: String(record.deductions),
    })
    setShowModal(true)
  }

  const requestApproval = (record: PayrollRecord) => {
    addApprovalRequest({
      request: `Payroll ${record.period}`,
      owner: "HR",
      amount: formatNaira(record.netPay),
      module: "HR",
    })
    alert("Approval requested. Review it in Operations → Approvals.")
  }

  const handleDeletePayroll = (id: string) => {
    if (onDeletePayroll) {
      onDeletePayroll(id)
    } else {
      setPayroll((prev) => prev.filter((p) => p.id !== id))
    }
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

  const unlockPayroll = () => {
    if (accessInput.trim() !== accessCode) {
      setAccessError("Invalid access code.")
      setAccessNotice("")
      return
    }
    setIsUnlocked(true)
    setShowAmounts(true)
    setAccessInput("")
    setAccessError("")
    setAccessNotice("")
  }

  const lockPayroll = () => {
    setIsUnlocked(false)
    setShowAmounts(false)
    setAccessInput("")
    setAccessError("")
    setAccessNotice("")
  }

  const updateAccessCode = () => {
    const next = newAccessCode.trim()
    const confirm = confirmAccessCode.trim()
    if (!next || next !== confirm) {
      setAccessError("Access codes do not match.")
      setAccessNotice("")
      return
    }
    setAccessCode(next)
    if (typeof window !== "undefined") {
      localStorage.setItem("civis_payroll_access_code", next)
    }
    setNewAccessCode("")
    setConfirmAccessCode("")
    setAccessError("")
    setAccessNotice("Access code updated.")
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payroll Access</CardTitle>
          <CardDescription>Protect salary data with an access code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isUnlocked ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Access code</label>
                <Input
                  type="password"
                  value={accessInput}
                  onChange={(e) => setAccessInput(e.target.value)}
                  placeholder="Enter payroll access code"
                />
                {accessError ? <p className="text-xs text-destructive mt-2">{accessError}</p> : null}
                <p className="text-xs text-muted-foreground mt-2">
                  Access is required to view, edit, or export payroll details.
                </p>
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={unlockPayroll}>
                  Unlock Payroll
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm text-muted-foreground">Payroll is unlocked for this session.</p>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input
                    type="password"
                    placeholder="New access code"
                    value={newAccessCode}
                    onChange={(e) => setNewAccessCode(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new code"
                    value={confirmAccessCode}
                    onChange={(e) => setConfirmAccessCode(e.target.value)}
                  />
                </div>
                {accessError ? <p className="text-xs text-destructive">{accessError}</p> : null}
                {accessNotice ? <p className="text-xs text-green-600 dark:text-green-400">{accessNotice}</p> : null}
              </div>
              <div className="flex flex-col gap-2 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={updateAccessCode}>
                  Update Access Code
                </Button>
                <Button variant="secondary" onClick={lockPayroll}>
                  Lock Payroll
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Payroll</p>
            <p className="text-2xl font-bold">{displayAmounts ? formatNaira(stats.total, true) : "****"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {displayAmounts ? formatNaira(stats.pending, true) : "****"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600">{displayAmounts ? formatNaira(stats.paid, true) : "****"}</p>
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
              disabled={!isUnlocked}
              className="flex items-center gap-2"
            >
              {showAmounts ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showAmounts ? "Hide" : "Show"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadPayrollCSV}
              disabled={!isUnlocked}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2" disabled={!isUnlocked}>
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
                {pagedPayroll.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-medium">{record.employee}</td>
                    <td className="py-4 px-4">{record.period}</td>
                    <td className="py-4 px-4">{displayAmounts ? formatNaira(record.baseSalary, true) : "****"}</td>
                    <td className="py-4 px-4">{displayAmounts ? formatNaira(record.bonus, true) : "****"}</td>
                    <td className="py-4 px-4">{displayAmounts ? formatNaira(record.deductions, true) : "****"}</td>
                    <td className="py-4 px-4 font-semibold text-primary">
                      {displayAmounts ? formatNaira(record.netPay, true) : "****"}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[record.status]}>
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {isUnlocked ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-2">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => alert(JSON.stringify(record, null, 2))}>
                              <Eye className="w-4 h-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditPayroll(record)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadPayrollCSV()}>
                              <Download className="w-4 h-4 mr-2" />
                              Download payslip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => requestApproval(record)}>
                              <CheckSquare className="w-4 h-4 mr-2" />
                              Request approval
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeletePayroll(record.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Button variant="ghost" size="sm" className="p-2" disabled>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
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

      {/* Add Payroll Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Payroll" : "Add New Payroll"}</CardTitle>
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
                    {editingId ? "Save Changes" : "Add Payroll"}
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
