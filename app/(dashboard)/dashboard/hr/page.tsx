"use client"

import { useState } from "react"
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
import { EmployeesTable, type Employee, mockEmployees } from "@/components/hr/employees-table"
import { PayrollTable, type PayrollRecord, mockPayroll } from "@/components/hr/payroll-table"
import { AttendanceTracker } from "@/components/hr/attendance-tracker"

export default function HRPage() {
  const searchQuery = ""
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [payroll, setPayroll] = useState<PayrollRecord[]>(mockPayroll)
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

  const handleAddEmployee = () => {
    if (employeeForm.name && employeeForm.department) {
      const payload: Omit<Employee, "id"> = {
        name: employeeForm.name,
        email: employeeForm.email || "user@example.com",
        phone: employeeForm.phone || "",
        department: employeeForm.department,
        position: employeeForm.position || "Staff",
        startDate: new Date().toISOString().slice(0, 10),
        status: "active",
        salary: 0,
      }
      setEmployees((prev) => [{ id: Date.now().toString(), ...payload }, ...prev])
      setEmployeeForm({ name: "", department: "", position: "", email: "", phone: "" })
      setOpenEmployeeDialog(false)
    }
  }

  const handleUpdateEmployee = (id: string, data: Omit<Employee, "id">) => {
    setEmployees((prev) => prev.map((emp) => (emp.id === id ? { id, ...data } : emp)))
  }

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id))
  }

  const addPayrollRecord = (record: Omit<PayrollRecord, "id">) => {
    setPayroll((prev) => [{ id: Date.now().toString(), ...record }, ...prev])
  }

  const handleAddPayroll = () => {
    if (payrollForm.employeeName && payrollForm.baseSalary) {
      const baseSalary = Number.parseFloat(payrollForm.baseSalary)
      const bonus = Number.parseFloat(payrollForm.bonus) || 0
      const deductions = Number.parseFloat(payrollForm.deductions) || 0
      addPayrollRecord({
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
    }
  }

  const handleUpdatePayroll = (id: string, data: Omit<PayrollRecord, "id">) => {
    setPayroll((prev) => prev.map((record) => (record.id === id ? { id, ...data } : record)))
  }

  const handleDeletePayroll = (id: string) => {
    setPayroll((prev) => prev.filter((record) => record.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HR & Employees</h1>
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
                    placeholder="e.g., 250,000"
                    value={payrollForm.baseSalary}
                    onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus">Bonus</Label>
                  <Input
                    id="bonus"
                    type="number"
                    placeholder="e.g., 50,000"
                    value={payrollForm.bonus}
                    onChange={(e) => setPayrollForm({ ...payrollForm, bonus: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deductions">Deductions</Label>
                  <Input
                    id="deductions"
                    type="number"
                    placeholder="e.g., 20,000"
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

      {/* People Pulse */}
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
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Employees: {employees.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Payroll records: {payroll.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Active: {employees.filter((emp) => emp.status === "active").length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <EmployeesTable
            searchQuery={searchQuery}
            employees={employees}
            onAddEmployee={(data) => setEmployees((prev) => [{ id: Date.now().toString(), ...data }, ...prev])}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <PayrollTable
            searchQuery={searchQuery}
            payroll={payroll}
            onAddPayroll={addPayrollRecord}
            onUpdatePayroll={handleUpdatePayroll}
            onDeletePayroll={handleDeletePayroll}
          />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceTracker searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
