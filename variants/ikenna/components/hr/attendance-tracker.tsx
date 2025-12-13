"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react"

interface AttendanceRecord {
  id: string
  employee: string
  date: string
  status: "present" | "absent" | "late" | "on-leave"
  checkIn: string
  checkOut: string
  hoursWorked: number
}

const statusConfig = {
  present: { badge: "bg-green-100 text-green-800", icon: CheckCircle },
  absent: { badge: "bg-red-100 text-red-800", icon: XCircle },
  late: { badge: "bg-yellow-100 text-yellow-800", icon: Clock },
  "on-leave": { badge: "bg-blue-100 text-blue-800", icon: Calendar },
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
]

export function AttendanceTracker({ searchQuery }: { searchQuery: string }) {
  const filteredAttendance = mockAttendance.filter((record) =>
    record.employee.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    present: filteredAttendance.filter((a) => a.status === "present").length,
    absent: filteredAttendance.filter((a) => a.status === "absent").length,
    late: filteredAttendance.filter((a) => a.status === "late").length,
    onLeave: filteredAttendance.filter((a) => a.status === "on-leave").length,
  }

  return (
    <div className="space-y-4">
      {/* Attendance Stats */}
      <div className="grid md:grid-cols-4 gap-4">
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
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
          <CardDescription>Daily attendance and check-in/check-out records</CardDescription>
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.map((record) => {
                  const StatusIcon = statusConfig[record.status].icon
                  return (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-4 px-4 font-medium">{record.employee}</td>
                      <td className="py-4 px-4">{record.checkIn}</td>
                      <td className="py-4 px-4">{record.checkOut}</td>
                      <td className="py-4 px-4">{record.hoursWorked > 0 ? `${record.hoursWorked}h` : "—"}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <Badge variant="outline" className={statusConfig[record.status].badge}>
                            {record.status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
