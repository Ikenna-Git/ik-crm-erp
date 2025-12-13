"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"

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
  const filteredEmployees = mockEmployees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const activeEmployees = mockEmployees.filter((e) => e.status === "active").length
  const totalSalary = mockEmployees.reduce((sum, e) => sum + e.salary, 0)

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
                    <td className="py-4 px-4 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
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
    </div>
  )
}
