"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles } from "lucide-react"
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
import { EmployeesTable, type Employee } from "@/components/hr/employees-table"
import { PayrollTable, type PayrollRecord } from "@/components/hr/payroll-table"
import { AttendanceTracker, type AttendanceRecord } from "@/components/hr/attendance-tracker"
import { PositionsTable, type Position } from "@/components/hr/positions-table"
import { HrQualityScorecard } from "@/components/hr/hr-quality-scorecard"
import { CompliancePack } from "@/components/hr/compliance-pack"

const today = () => new Date().toISOString().slice(0, 10)
const toDateString = (value?: string | null) => (value ? String(value).slice(0, 10) : today())

const requestJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data
}

const mapEmployee = (employee: any): Employee => ({
  id: employee.id,
  name: employee.name,
  email: employee.email || "",
  phone: employee.phone || "",
  department: employee.department || "Operations",
  position: employee.position?.title || "Staff",
  startDate: toDateString(employee.startDate || employee.createdAt),
  status: employee.status === "leave" || employee.status === "inactive" ? employee.status : "active",
  salary: Number(employee.salary || 0),
})

const mapPayroll = (record: any): PayrollRecord => ({
  id: record.id,
  employee: record.employeeName,
  period: record.period,
  baseSalary: Number(record.baseSalary || 0),
  bonus: Number(record.bonus || 0),
  deductions: Number(record.deductions || 0),
  netPay: Number(record.netPay || 0),
  status: record.status === "paid" || record.status === "processed" ? record.status : "pending",
})

const mapAttendance = (record: any): AttendanceRecord => ({
  id: record.id,
  employee: record.employeeName,
  date: toDateString(record.date),
  status: ["present", "absent", "late", "on-leave", "remote"].includes(record.status) ? record.status : "present",
  checkIn: record.checkIn || "—",
  checkOut: record.checkOut || "—",
  hoursWorked: Number(record.hoursWorked || 0),
  leaveType: record.leaveType || undefined,
  leaveStart: record.leaveStart ? toDateString(record.leaveStart) : undefined,
  leaveEnd: record.leaveEnd ? toDateString(record.leaveEnd) : undefined,
  remindOnReturn: Boolean(record.remindOnReturn),
  note: record.note || undefined,
})

const mapPosition = (position: any): Position => ({
  id: position.id,
  title: position.title,
  department: position.department || "Operations",
  headcount: Number(position.headcount || 1),
  status: position.status === "filled" || position.status === "paused" ? position.status : "open",
  updatedAt: toDateString(position.updatedAt),
})

export default function HRPage() {
  const searchQuery = ""
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false)
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    department: "",
    position: "",
    email: "",
    phone: "",
  })

  const [openPayrollDialog, setOpenPayrollDialog] = useState(false)
  const [payrollForm, setPayrollForm] = useState({
    employeeName: "",
    baseSalary: "",
    bonus: "",
    deductions: "",
  })

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [employeesRes, payrollRes, attendanceRes, positionsRes] = await Promise.all([
        requestJson("/api/hr/employees"),
        requestJson("/api/hr/payroll"),
        requestJson("/api/hr/attendance"),
        requestJson("/api/hr/positions"),
      ])
      setEmployees((employeesRes.employees || []).map(mapEmployee))
      setPayroll((payrollRes.payroll || []).map(mapPayroll))
      setAttendance((attendanceRes.attendance || []).map(mapAttendance))
      setPositions((positionsRes.positions || []).map(mapPosition))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load HR data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addEmployee = async (data: Omit<Employee, "id">) => {
    const response = await requestJson("/api/hr/employees", {
      method: "POST",
      body: JSON.stringify(data),
    })
    setEmployees((prev) => [mapEmployee(response.employee), ...prev])
  }

  const handleAddEmployee = async () => {
    if (!employeeForm.name || !employeeForm.department) return
    try {
      await addEmployee({
        name: employeeForm.name,
        email: employeeForm.email || "user@example.com",
        phone: employeeForm.phone || "",
        department: employeeForm.department,
        position: employeeForm.position || "Staff",
        startDate: today(),
        status: "active",
        salary: 0,
      })
      setEmployeeForm({ name: "", department: "", position: "", email: "", phone: "" })
      setOpenEmployeeDialog(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee")
    }
  }

  const handleUpdateEmployee = async (id: string, data: Omit<Employee, "id">) => {
    try {
      const response = await requestJson("/api/hr/employees", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      })
      setEmployees((prev) => prev.map((emp) => (emp.id === id ? mapEmployee(response.employee) : emp)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update employee")
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    try {
      await requestJson(`/api/hr/employees?id=${id}`, { method: "DELETE" })
      setEmployees((prev) => prev.filter((emp) => emp.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee")
    }
  }

  const addPayrollRecord = async (record: Omit<PayrollRecord, "id">) => {
    const response = await requestJson("/api/hr/payroll", {
      method: "POST",
      body: JSON.stringify({
        employee: record.employee,
        period: record.period,
        baseSalary: record.baseSalary,
        bonus: record.bonus,
        deductions: record.deductions,
        status: record.status,
      }),
    })
    setPayroll((prev) => [mapPayroll(response.record), ...prev])
  }

  const handleAddPayroll = async () => {
    if (!payrollForm.employeeName || !payrollForm.baseSalary) return
    try {
      const baseSalary = Number.parseFloat(payrollForm.baseSalary)
      const bonus = Number.parseFloat(payrollForm.bonus) || 0
      const deductions = Number.parseFloat(payrollForm.deductions) || 0
      await addPayrollRecord({
        employee: payrollForm.employeeName,
        period: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
        baseSalary,
        bonus,
        deductions,
        netPay: baseSalary + bonus - deductions,
        status: "pending",
      })
      setPayrollForm({ employeeName: "", baseSalary: "", bonus: "", deductions: "" })
      setOpenPayrollDialog(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payroll")
    }
  }

  const handleUpdatePayroll = async (id: string, data: Omit<PayrollRecord, "id">) => {
    try {
      const response = await requestJson("/api/hr/payroll", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          employee: data.employee,
          period: data.period,
          baseSalary: data.baseSalary,
          bonus: data.bonus,
          deductions: data.deductions,
          status: data.status,
        }),
      })
      setPayroll((prev) => prev.map((record) => (record.id === id ? mapPayroll(response.record) : record)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update payroll")
    }
  }

  const handleDeletePayroll = async (id: string) => {
    try {
      await requestJson(`/api/hr/payroll?id=${id}`, { method: "DELETE" })
      setPayroll((prev) => prev.filter((record) => record.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete payroll")
    }
  }

  const handleAddAttendance = async (data: Omit<AttendanceRecord, "id">) => {
    try {
      const response = await requestJson("/api/hr/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      })
      setAttendance((prev) => [mapAttendance(response.record), ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add attendance")
    }
  }

  const handleUpdateAttendance = async (id: string, data: Omit<AttendanceRecord, "id">) => {
    try {
      const response = await requestJson("/api/hr/attendance", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      })
      setAttendance((prev) => prev.map((record) => (record.id === id ? mapAttendance(response.record) : record)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update attendance")
    }
  }

  const handleAddPosition = async (data: Omit<Position, "id">) => {
    try {
      const response = await requestJson("/api/hr/positions", {
        method: "POST",
        body: JSON.stringify(data),
      })
      setPositions((prev) => [mapPosition(response.position), ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add position")
    }
  }

  const handleUpdatePosition = async (id: string, data: Omit<Position, "id">) => {
    try {
      const response = await requestJson("/api/hr/positions", {
        method: "PATCH",
        body: JSON.stringify({ id, ...data }),
      })
      setPositions((prev) => prev.map((position) => (position.id === id ? mapPosition(response.position) : position)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update position")
    }
  }

  const handleDeletePosition = async (id: string) => {
    try {
      await requestJson(`/api/hr/positions?id=${id}`, { method: "DELETE" })
      setPositions((prev) => prev.filter((position) => position.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete position")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-ai-anchor="hr-header">
            HR & Employees
          </h1>
          <p className="text-muted-foreground mt-1">Manage employees, payroll, and attendance</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openPayrollDialog} onOpenChange={setOpenPayrollDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Plus className="w-4 h-4" />
                New Payroll
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Payroll</DialogTitle>
                <DialogDescription>Create a new payroll record</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emp-name">Employee Name</Label>
                  <Input
                    id="emp-name"
                    placeholder="Select or type employee name"
                    value={payrollForm.employeeName}
                    onChange={(e) => setPayrollForm({ ...payrollForm, employeeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="base-salary">Base Salary</Label>
                  <Input
                    id="base-salary"
                    type="number"
                    placeholder="e.g., 250000"
                    value={payrollForm.baseSalary}
                    onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus">Bonus</Label>
                  <Input
                    id="bonus"
                    type="number"
                    placeholder="e.g., 50000"
                    value={payrollForm.bonus}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    placeholder="e.g., 20000"
                    value={payrollForm.deductions}
                    onChange={(e) => setPayrollForm({ ...payrollForm, deductions: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddPayroll} className="w-full">
                  Add Payroll
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={openEmployeeDialog} onOpenChange={setOpenEmployeeDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Employee
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
                <DialogDescription>Create a new employee record</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Select
                    value={employeeForm.department}
                    onValueChange={(value) => setEmployeeForm({ ...employeeForm, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="e.g., Sales Manager"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+234 800 123 4567"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddEmployee} className="w-full">
                  Add Employee
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

      <HrQualityScorecard employees={employees} />
      <CompliancePack employeesCount={employees.length} payrollRuns={payroll.length} />

      <div className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">People Pulse</p>
            <p className="text-sm text-muted-foreground">Track headcount, payroll, and attendance.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Employees: {employees.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Payroll records: {payroll.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Active: {employees.filter((emp) => emp.status === "active").length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            {loading ? "Syncing" : "Live DB"}
          </span>
        </div>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="positions">Positions</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="space-y-4">
          <EmployeesTable
            searchQuery={searchQuery}
            employees={employees}
            onAddEmployee={addEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollTable
            searchQuery={searchQuery}
            payroll={payroll}
            onAddPayroll={addPayrollRecord}
            onUpdatePayroll={handleUpdatePayroll}
            onDeletePayroll={handleDeletePayroll}
          />
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <PositionsTable
            positions={positions}
            onAddPosition={handleAddPosition}
            onUpdatePosition={handleUpdatePosition}
            onDeletePosition={handleDeletePosition}
          />
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <AttendanceTracker
            searchQuery={searchQuery}
            records={attendance}
            onAddRecord={handleAddAttendance}
            onUpdateRecord={handleUpdateAttendance}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
