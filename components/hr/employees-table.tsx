"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MoreHorizontal, Eye, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  position: string
  startDate: string
  status: "active" | "leave" | "inactive"
  salary: number
}

const departmentColors = {
  Engineering: "bg-blue-100 text-blue-800",
  Sales: "bg-green-100 text-green-800",
  Marketing: "bg-purple-100 text-purple-800",
  HR: "bg-pink-100 text-pink-800",
  Finance: "bg-yellow-100 text-yellow-800",
  Operations: "bg-orange-100 text-orange-800",
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  leave: "bg-yellow-100 text-yellow-800",
  inactive: "bg-gray-100 text-gray-800",
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    phone: "+1 (555) 123-4567",
    department: "Engineering",
    position: "Senior Developer",
    startDate: "2022-03-15",
    status: "active",
    salary: 125000,
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael.chen@company.com",
    phone: "+1 (555) 234-5678",
    department: "Sales",
    position: "Sales Manager",
    startDate: "2020-07-01",
    status: "active",
    salary: 95000,
  },
  {
    id: "3",
    name: "Emma Davis",
    email: "emma.davis@company.com",
    phone: "+1 (555) 345-6789",
    department: "Marketing",
    position: "Marketing Lead",
    startDate: "2021-11-10",
    status: "active",
    salary: 85000,
  },
  {
    id: "4",
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+1 (555) 456-7890",
    department: "Engineering",
    position: "DevOps Engineer",
    startDate: "2023-01-20",
    status: "leave",
    salary: 110000,
  },
  {
    id: "5",
    name: "Lisa Anderson",
    email: "lisa.anderson@company.com",
    phone: "+1 (555) 567-8901",
    department: "HR",
    position: "HR Manager",
    startDate: "2021-06-15",
    status: "active",
    salary: 80000,
  },
]

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export function EmployeesTable({ searchQuery }: { searchQuery: string }) {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    position: "",
    startDate: "",
    status: "active" as Employee["status"],
    salary: "",
  })

  useEffect(() => {
    setEmployees(mockEmployees)
  }, [])

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeEmployees = employees.filter((e) => e.status === "active").length
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0)

  const openEditor = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id)
      setForm({
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        department: employee.department,
        position: employee.position,
        startDate: employee.startDate,
        status: employee.status,
        salary: String(employee.salary),
      })
    } else {
      setEditingId(null)
      setForm({
        name: "",
        email: "",
        phone: "",
        department: "",
        position: "",
        startDate: "",
        status: "active",
        salary: "",
      })
    }
    setShowModal(true)
  }

  const saveEmployee = () => {
    const payload: Employee = {
      id: editingId || Date.now().toString(),
      name: form.name || "Unnamed",
      email: form.email || "user@example.com",
      phone: form.phone || "",
      department: form.department || "Operations",
      position: form.position || "Staff",
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      status: form.status,
      salary: Number(form.salary || 0),
    }
    if (editingId) {
      setEmployees((prev) => prev.map((e) => (e.id === editingId ? payload : e)))
    } else {
      setEmployees((prev) => [payload, ...prev])
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{mockEmployees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeEmployees}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Salary Cost</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(totalSalary)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory ({filteredEmployees.length})</CardTitle>
          <CardDescription>All company employees and their information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Position</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Start Date</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Salary</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        variant="outline"
                        className={
                          departmentColors[employee.department as keyof typeof departmentColors] || "bg-gray-100"
                        }
                      >
                        {employee.department}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">{employee.position}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[employee.status]}>
                        {employee.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{employee.startDate}</td>
                    <td className="py-4 px-4 font-semibold">{formatNaira(employee.salary)}</td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(employee, null, 2))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditor(employee)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteEmployee(employee.id)}>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>{editingId ? "Edit Employee" : "Add Employee"}</CardTitle>
                <CardDescription>Update details and roles.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Full name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Position</Label>
                  <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Start date</Label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Input
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as Employee["status"] })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Salary</Label>
                  <Input
                    type="number"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEmployee}>{editingId ? "Save changes" : "Add employee"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
