import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { seedHrData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable payroll data." }, { status: 503 })

const handleError = (error: unknown, fallback: string) => {
  console.error(fallback, error)
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    await seedHrData(org.id)
    const payroll = await prisma.payrollRecord.findMany({
      where: { orgId: org.id },
      orderBy: [{ createdAt: "desc" }, { period: "desc" }],
    })
    return NextResponse.json({ payroll })
  } catch (error) {
    return handleError(error, "Failed to load payroll")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { employee, employeeId, period, baseSalary, bonus, deductions, status } = body || {}
    if (!employee || !period) {
      return NextResponse.json({ error: "employee and period are required" }, { status: 400 })
    }

    if (employeeId) {
      const scopedEmployee = await prisma.employee.findFirst({
        where: { id: String(employeeId), orgId: org.id },
      })
      if (!scopedEmployee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
    }

    const base = Number(baseSalary || 0)
    const extra = Number(bonus || 0)
    const minus = Number(deductions || 0)

    const record = await prisma.payrollRecord.create({
      data: {
        orgId: org.id,
        employeeId: employeeId || null,
        employeeName: String(employee).trim(),
        period: String(period).trim(),
        baseSalary: base,
        bonus: extra,
        deductions: minus,
        netPay: base + extra - minus,
        status: status ? String(status).trim().toLowerCase() : "pending",
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created payroll record",
      entity: "PayrollRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, period: record.period },
    })

    return NextResponse.json({ record })
  } catch (error) {
    return handleError(error, "Failed to create payroll record")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, employee, employeeId, period, baseSalary, bonus, deductions, status } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const current = await prisma.payrollRecord.findFirst({
      where: { id, orgId: org.id },
    })
    if (!current) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    if (employeeId) {
      const scopedEmployee = await prisma.employee.findFirst({
        where: { id: String(employeeId), orgId: org.id },
      })
      if (!scopedEmployee) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      }
    }

    const data: Record<string, unknown> = {}
    if (employee !== undefined) data.employeeName = String(employee).trim()
    if (employeeId !== undefined) data.employeeId = employeeId || null
    if (period !== undefined) data.period = String(period).trim()
    if (baseSalary !== undefined || bonus !== undefined || deductions !== undefined) {
      const base = baseSalary !== undefined ? Number(baseSalary || 0) : current?.baseSalary || 0
      const extra = bonus !== undefined ? Number(bonus || 0) : current?.bonus || 0
      const minus = deductions !== undefined ? Number(deductions || 0) : current?.deductions || 0
      data.baseSalary = base
      data.bonus = extra
      data.deductions = minus
      data.netPay = base + extra - minus
    }
    if (status !== undefined) data.status = String(status).trim().toLowerCase()

    const record = await prisma.payrollRecord.update({ where: { id }, data })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated payroll record",
      entity: "PayrollRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, period: record.period },
    })

    return NextResponse.json({ record })
  } catch (error) {
    return handleError(error, "Failed to update payroll record")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const current = await prisma.payrollRecord.findFirst({
      where: { id, orgId: org.id },
    })
    if (!current) {
      return NextResponse.json({ error: "Payroll record not found" }, { status: 404 })
    }

    const record = await prisma.payrollRecord.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted payroll record",
      entity: "PayrollRecord",
      entityId: record.id,
      metadata: { employee: record.employeeName, period: record.period },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleError(error, "Failed to delete payroll record")
  }
}
