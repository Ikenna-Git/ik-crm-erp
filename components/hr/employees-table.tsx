"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, MoreHorizontal, Eye, X, Lock } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface Employee {
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
  Engineering: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  Sales: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  Marketing: "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200",
  HR: "bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200",
  Finance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  Operations: "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  leave: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-slate-700/40 dark:text-slate-200",
}

const firstNames = ["Sarah", "Michael", "Emma", "John", "Lisa", "David", "Ava", "Noah", "Grace", "Daniel"]
const lastNames = ["Johnson", "Chen", "Davis", "Smith", "Anderson", "Okafor", "Umeh", "Martins", "Williams", "Brown"]
const departments = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"] as const
const positionsByDepartment: Record<(typeof departments)[number], string[]> = {
  Engineering: ["Senior Developer", "DevOps Engineer", "QA Engineer", "Frontend Engineer"],
  Sales: ["Sales Manager", "Account Executive", "Sales Lead", "BDR"],
  Marketing: ["Marketing Lead", "Content Strategist", "Growth Manager", "Brand Designer"],
  HR: ["HR Manager", "People Ops", "Recruiter", "HR Analyst"],
  Finance: ["Financial Analyst", "Accountant", "Payroll Specialist", "Finance Manager"],
  Operations: ["Ops Lead", "Support Manager", "Facilities Lead", "Program Coordinator"],
}

const buildMockEmployees = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const first = firstNames[idx % firstNames.length]
    const last = lastNames[(idx * 3) % lastNames.length]
    const department = departments[idx % departments.length]
    const positions = positionsByDepartment[department]
    const position = positions[idx % positions.length]
    const statusOptions: Employee["status"][] = ["active", "leave", "inactive"]
    const status = statusOptions[idx % statusOptions.length]
    const startDate = new Date(2020, idx % 12, (idx % 28) + 1).toISOString().slice(0, 10)

    return {
      id: `EMP-${(idx + 1).toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@civis.io`,
      phone: `+1 (555) ${(200 + idx).toString().padStart(3, "0")}-${(3000 + idx).toString().padStart(4, "0")}`,
      department,
      position,
      startDate,
      status,
      salary: 65000 + (idx % 10) * 8500,
    }
  })

export const mockEmployees: Employee[] = buildMockEmployees(70)

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

type EmployeesTableProps = {
  searchQuery: string
  employees?: Employee[]
  onAddEmployee?: (data: Omit<Employee, "id">) => void
  onUpdateEmployee?: (id: string, data: Omit<Employee, "id">) => void
  onDeleteEmployee?: (id: string) => void
}

export function EmployeesTable({
  searchQuery,
  employees: providedEmployees,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
}: EmployeesTableProps) {
  const [employees, setEmployees] = useState<Employee[]>(providedEmployees || mockEmployees)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showSalaries, setShowSalaries] = useState(false)
  const [accessCode, setAccessCode] = useState("1234")
  const [accessInput, setAccessInput] = useState("")
  const [accessError, setAccessError] = useState("")
  const [accessNotice, setAccessNotice] = useState("")
  const [newAccessCode, setNewAccessCode] = useState("")
  const [confirmAccessCode, setConfirmAccessCode] = useState("")
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
    if (providedEmployees) setEmployees(providedEmployees)
  }, [providedEmployees])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("civis_hr_access_code")
    if (stored) {
      setAccessCode(stored)
    } else {
      localStorage.setItem("civis_hr_access_code", "1234")
    }
    setShowSalaries(false)
  }, [])

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const sortedEmployees = [...filteredEmployees].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const activeEmployees = employees.filter((e) => e.status === "active").length
  const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0)

  const displaySalary = isUnlocked && showSalaries

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(sortedEmployees.length / PAGE_SIZE))
  const pagedEmployees = sortedEmployees.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const unlockAccess = () => {
    if (accessInput.trim() !== accessCode) {
      setAccessError("Invalid access code.")
      setAccessNotice("")
      return
    }
    setIsUnlocked(true)
    setShowSalaries(true)
    setAccessInput("")
    setAccessError("")
    setAccessNotice("")
  }

  const lockAccess = () => {
    setIsUnlocked(false)
    setShowSalaries(false)
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
      localStorage.setItem("civis_hr_access_code", next)
    }
    setNewAccessCode("")
    setConfirmAccessCode("")
    setAccessError("")
    setAccessNotice("Access code updated.")
  }

  const openEditor = (employee?: Employee) => {
    if (!isUnlocked) return
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
    const payload: Omit<Employee, "id"> = {
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
      if (onUpdateEmployee) {
        onUpdateEmployee(editingId, payload)
      } else {
        setEmployees((prev) => prev.map((e) => (e.id === editingId ? { id: editingId, ...payload } : e)))
      }
    } else {
      if (onAddEmployee) {
        onAddEmployee(payload)
      } else {
        setEmployees((prev) => [{ id: Date.now().toString(), ...payload }, ...prev])
      }
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteEmployee = (id: string) => {
    if (!isUnlocked) return
    if (onDeleteEmployee) {
      onDeleteEmployee(id)
    } else {
      setEmployees((prev) => prev.filter((e) => e.id !== id))
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>HR Access</CardTitle>
          <CardDescription>Protect employee salary data with an access code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isUnlocked ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Access code</Label>
                <Input
                  type="password"
                  value={accessInput}
                  onChange={(e) => setAccessInput(e.target.value)}
                  placeholder="Enter HR access code"
                />
                {accessError ? <p className="text-xs text-destructive mt-2">{accessError}</p> : null}
              </div>
              <div className="flex items-end">
                <Button className="w-full" onClick={unlockAccess}>
                  Unlock HR Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm text-muted-foreground">HR data unlocked for this session.</p>
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
                <Button variant="outline" className="bg-transparent" onClick={() => setShowSalaries(!showSalaries)}>
                  {showSalaries ? "Hide salaries" : "Show salaries"}
                </Button>
                <Button variant="secondary" onClick={lockAccess}>
                  Lock HR Data
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
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{employees.length}</p>
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
            <p className="text-2xl font-bold text-primary">{displaySalary ? formatNaira(totalSalary) : "****"}</p>
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
                {pagedEmployees.map((employee) => (
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
                          departmentColors[employee.department as keyof typeof departmentColors] ||
                          "bg-gray-100 text-gray-800 dark:bg-slate-700/40 dark:text-slate-200"
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
                    <td className="py-4 px-4 font-semibold">{displaySalary ? formatNaira(employee.salary) : "****"}</td>
                    <td className="py-4 px-4">
                      {isUnlocked ? (
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
                      ) : (
                        <Button variant="ghost" size="sm" className="p-2" disabled>
                          <Lock className="w-4 h-4" />
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
