"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
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
import { EmployeesTable } from "@/components/hr/employees-table"
import { PayrollTable } from "@/components/hr/payroll-table"
import { AttendanceTracker } from "@/components/hr/attendance-tracker"

export default function HRPage() {
  const [searchQuery, setSearchQuery] = useState("")
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
      console.log("Adding employee:", employeeForm)
      setEmployeeForm({ name: "", department: "", position: "", email: "", phone: "" })
      setOpenEmployeeDialog(false)
    }
  }

  const handleAddPayroll = () => {
    if (payrollForm.employeeName && payrollForm.baseSalary) {
      console.log("Adding payroll:", payrollForm)
      setPayrollForm({ employeeName: "", baseSalary: "", bonus: "", deductions: "" })
      setOpenPayrollDialog(false)
    }
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
          <EmployeesTable searchQuery={searchQuery} />
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <PayrollTable searchQuery={searchQuery} />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceTracker searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
