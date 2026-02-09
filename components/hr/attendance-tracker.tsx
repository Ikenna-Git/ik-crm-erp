"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, CheckCircle, XCircle, Clock, Laptop, Plus, Pencil } from "lucide-react"

interface AttendanceRecord {
  id: string
  employee: string
  date: string
  status: "present" | "absent" | "late" | "on-leave" | "remote"
  checkIn: string
  checkOut: string
  hoursWorked: number
  leaveType?: "Annual" | "Sick" | "Training" | "Maternity" | "Compassionate"
  leaveStart?: string
  leaveEnd?: string
  remindOnReturn?: boolean
  note?: string
}

const statusConfig = {
  present: { badge: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200", icon: CheckCircle },
  absent: { badge: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200", icon: XCircle },
  late: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200", icon: Clock },
  "on-leave": { badge: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200", icon: Calendar },
  remote: { badge: "bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-200", icon: Laptop },
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: "1",
    employee: "Sarah Johnson",
    date: "2025-02-07",
    status: "present",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: 8.5,
  },
  {
    id: "2",
    employee: "Michael Chen",
    date: "2025-02-07",
    status: "present",
    checkIn: "09:15 AM",
    checkOut: "05:45 PM",
    hoursWorked: 8.5,
  },
  {
    id: "3",
    employee: "Emma Davis",
    date: "2025-02-07",
    status: "late",
    checkIn: "09:30 AM",
    checkOut: "06:00 PM",
    hoursWorked: 8.5,
  },
  {
    id: "4",
    employee: "John Smith",
    date: "2025-02-07",
    status: "on-leave",
    checkIn: "—",
    checkOut: "—",
    hoursWorked: 0,
    leaveType: "Annual",
    leaveStart: "2025-02-05",
    leaveEnd: "2025-02-12",
    remindOnReturn: true,
  },
  {
    id: "5",
    employee: "Lisa Anderson",
    date: "2025-02-07",
    status: "present",
    checkIn: "09:00 AM",
    checkOut: "05:30 PM",
    hoursWorked: 8.5,
  },
  {
    id: "6",
    employee: "Noah Brown",
    date: "2025-02-07",
    status: "remote",
    checkIn: "08:45 AM",
    checkOut: "04:30 PM",
    hoursWorked: 7.8,
  },
  {
    id: "7",
    employee: "Grace Martins",
    date: "2025-02-07",
    status: "on-leave",
    checkIn: "—",
    checkOut: "—",
    hoursWorked: 0,
    leaveType: "Sick",
    leaveStart: "2025-02-06",
    leaveEnd: "2025-02-10",
    remindOnReturn: true,
  },
]

export function AttendanceTracker({ searchQuery }: { searchQuery: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>(mockAttendance)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    employee: "",
    date: "",
    status: "present" as AttendanceRecord["status"],
    checkIn: "",
    checkOut: "",
    hoursWorked: "",
    leaveType: "Annual" as AttendanceRecord["leaveType"],
    leaveStart: "",
    leaveEnd: "",
    remindOnReturn: false,
    note: "",
  })

  const filteredAttendance = records.filter((record) =>
    record.employee.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const stats = {
    present: filteredAttendance.filter((a) => a.status === "present").length,
    absent: filteredAttendance.filter((a) => a.status === "absent").length,
    late: filteredAttendance.filter((a) => a.status === "late").length,
    onLeave: filteredAttendance.filter((a) => a.status === "on-leave").length,
    remote: filteredAttendance.filter((a) => a.status === "remote").length,
  }

  const totalPages = Math.max(1, Math.ceil(filteredAttendance.length / pageSize))
  const pagedAttendance = filteredAttendance.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const upcomingReturns = useMemo(() => {
    const today = new Date()
    const sevenDays = new Date(today)
    sevenDays.setDate(today.getDate() + 7)
    return records.filter((record) => {
      if (record.status !== "on-leave" || !record.leaveEnd || !record.remindOnReturn) return false
      const end = new Date(record.leaveEnd)
      return end >= today && end <= sevenDays
    })
  }, [records])

  const openEditor = (record?: AttendanceRecord) => {
    if (record) {
      setEditingId(record.id)
      setForm({
        employee: record.employee,
        date: record.date,
        status: record.status,
        checkIn: record.checkIn === "—" ? "" : record.checkIn,
        checkOut: record.checkOut === "—" ? "" : record.checkOut,
        hoursWorked: record.hoursWorked ? String(record.hoursWorked) : "",
        leaveType: record.leaveType || "Annual",
        leaveStart: record.leaveStart || "",
        leaveEnd: record.leaveEnd || "",
        remindOnReturn: Boolean(record.remindOnReturn),
        note: record.note || "",
      })
    } else {
      setEditingId(null)
      setForm({
        employee: "",
        date: new Date().toISOString().slice(0, 10),
        status: "present",
        checkIn: "",
        checkOut: "",
        hoursWorked: "",
        leaveType: "Annual",
        leaveStart: "",
        leaveEnd: "",
        remindOnReturn: false,
        note: "",
      })
    }
    setDialogOpen(true)
  }

  const saveRecord = () => {
    if (!form.employee.trim() || !form.date) return
    const payload: AttendanceRecord = {
      id: editingId || Date.now().toString(),
      employee: form.employee.trim(),
      date: form.date,
      status: form.status,
      checkIn: form.status === "on-leave" || form.status === "absent" ? "—" : form.checkIn || "—",
      checkOut: form.status === "on-leave" || form.status === "absent" ? "—" : form.checkOut || "—",
      hoursWorked:
        form.status === "on-leave" || form.status === "absent"
          ? 0
          : Number.parseFloat(form.hoursWorked) || 0,
      leaveType: form.status === "on-leave" ? form.leaveType : undefined,
      leaveStart: form.status === "on-leave" ? form.leaveStart : undefined,
      leaveEnd: form.status === "on-leave" ? form.leaveEnd : undefined,
      remindOnReturn: form.status === "on-leave" ? form.remindOnReturn : undefined,
      note: form.note.trim() || undefined,
    }

    if (editingId) {
      setRecords((prev) => prev.map((record) => (record.id === editingId ? payload : record)))
    } else {
      setRecords((prev) => [payload, ...prev])
    }
    setDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* Attendance Stats */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Present</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Absent</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Late</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">On Leave</p>
            <p className="text-2xl font-bold text-blue-600">{stats.onLeave}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remote</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-200">{stats.remote}</p>
          </CardContent>
        </Card>
      </div>

      {upcomingReturns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Return Reminders</CardTitle>
            <CardDescription>Employees returning from leave in the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingReturns.map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{record.employee}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.leaveType || "Leave"} ends {record.leaveEnd}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Reminder enabled
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Today's Attendance</CardTitle>
            <CardDescription>Daily attendance and check-in/check-out records</CardDescription>
          </div>
          <Button size="sm" onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-2" />
            Record attendance
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Check In</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Check Out</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Hours Worked</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Leave</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {pagedAttendance.map((record) => {
                  const StatusIcon = statusConfig[record.status].icon
                  return (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-4 px-4 font-medium">{record.employee}</td>
                      <td className="py-4 px-4">{record.checkIn}</td>
                      <td className="py-4 px-4">{record.checkOut}</td>
                      <td className="py-4 px-4">{record.hoursWorked > 0 ? `${record.hoursWorked}h` : "—"}</td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {record.status === "on-leave" && record.leaveStart && record.leaveEnd
                          ? `${record.leaveStart} → ${record.leaveEnd}`
                          : "—"}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <Badge variant="outline" className={statusConfig[record.status].badge}>
                            {record.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openEditor(record)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Update
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="pt-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Update attendance" : "Record attendance"}</DialogTitle>
            <DialogDescription>Track check-ins, remote work, and leave periods.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="attendance-employee">Employee</Label>
                <Input
                  id="attendance-employee"
                  value={form.employee}
                  onChange={(event) => setForm({ ...form, employee: event.target.value })}
                  placeholder="Employee name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendance-date">Date</Label>
                <Input
                  id="attendance-date"
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value as AttendanceRecord["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.status === "on-leave" ? (
                <div className="space-y-2">
                  <Label>Leave type</Label>
                  <Select
                    value={form.leaveType}
                    onValueChange={(value) => setForm({ ...form, leaveType: value as AttendanceRecord["leaveType"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                      <SelectItem value="Compassionate">Compassionate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>

            {form.status === "on-leave" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Leave start</Label>
                  <Input
                    type="date"
                    value={form.leaveStart}
                    onChange={(event) => setForm({ ...form, leaveStart: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Leave end</Label>
                  <Input
                    type="date"
                    value={form.leaveEnd}
                    onChange={(event) => setForm({ ...form, leaveEnd: event.target.value })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.remindOnReturn}
                    onCheckedChange={(checked) => setForm({ ...form, remindOnReturn: Boolean(checked) })}
                  />
                  Remind me before return date
                </label>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Check in</Label>
                  <Input
                    value={form.checkIn}
                    onChange={(event) => setForm({ ...form, checkIn: event.target.value })}
                    placeholder="09:00 AM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check out</Label>
                  <Input
                    value={form.checkOut}
                    onChange={(event) => setForm({ ...form, checkOut: event.target.value })}
                    placeholder="05:30 PM"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hours worked</Label>
                  <Input
                    type="number"
                    value={form.hoursWorked}
                    onChange={(event) => setForm({ ...form, hoursWorked: event.target.value })}
                    placeholder="8.0"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                placeholder="Optional notes for HR follow-up."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="bg-transparent" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveRecord}>{editingId ? "Save update" : "Save attendance"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
