import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { seedHrData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable attendance data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "hr", "view")
    await seedHrData(org.id)
    const attendance = await prisma.attendanceRecord.findMany({
      where: { orgId: org.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ attendance })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load attendance")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const {
      employee,
      employeeId,
      date,
      status,
      checkIn,
      checkOut,
      hoursWorked,
      leaveType,
      leaveStart,
      leaveEnd,
      remindOnReturn,
      note,
    } = body || {}

    if (!employee || !date || !status) {
      return NextResponse.json({ error: "employee, date, and status are required" }, { status: 400 })
    }

    if (employeeId) {
      const scopedEmployee = await prisma.employee.findFirst({
        where: { id: String(employeeId), orgId: org.id },
      })
      if (!scopedEmployee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        orgId: org.id,
        employeeId: employeeId || null,
        employeeName: String(employee).trim(),
        date: new Date(date),
        status: String(status).trim().toLowerCase(),
        checkIn: checkIn ? String(checkIn).trim() : null,
        checkOut: checkOut ? String(checkOut).trim() : null,
        hoursWorked: Number(hoursWorked || 0),
        leaveType: leaveType ? String(leaveType).trim() : null,
        leaveStart: leaveStart ? new Date(leaveStart) : null,
        leaveEnd: leaveEnd ? new Date(leaveEnd) : null,
        remindOnReturn: Boolean(remindOnReturn),
        note: note ? String(note).trim() : null,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Recorded attendance",
      entity: "AttendanceRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, status: record.status },
    })

    return NextResponse.json({ record })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create attendance record")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const {
      id,
      employee,
      employeeId,
      date,
      status,
      checkIn,
      checkOut,
      hoursWorked,
      leaveType,
      leaveStart,
      leaveEnd,
      remindOnReturn,
      note,
    } = body || {}

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    if (employeeId) {
      const scopedEmployee = await prisma.employee.findFirst({
        where: { id: String(employeeId), orgId: org.id },
      })
      if (!scopedEmployee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
    }

    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        employeeName: employee !== undefined ? String(employee).trim() : undefined,
        employeeId: employeeId !== undefined ? employeeId || null : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
        checkIn: checkIn !== undefined ? (checkIn ? String(checkIn).trim() : null) : undefined,
        checkOut: checkOut !== undefined ? (checkOut ? String(checkOut).trim() : null) : undefined,
        hoursWorked: hoursWorked !== undefined ? Number(hoursWorked || 0) : undefined,
        leaveType: leaveType !== undefined ? (leaveType ? String(leaveType).trim() : null) : undefined,
        leaveStart: leaveStart !== undefined ? (leaveStart ? new Date(leaveStart) : null) : undefined,
        leaveEnd: leaveEnd !== undefined ? (leaveEnd ? new Date(leaveEnd) : null) : undefined,
        remindOnReturn: remindOnReturn !== undefined ? Boolean(remindOnReturn) : undefined,
        note: note !== undefined ? (note ? String(note).trim() : null) : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated attendance record",
      entity: "AttendanceRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, status: record.status },
    })

    return NextResponse.json({ record })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update attendance record")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingRecord) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 })
    }

    const record = await prisma.attendanceRecord.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted attendance record",
      entity: "AttendanceRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, status: record.status },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete attendance record")
  }
}
