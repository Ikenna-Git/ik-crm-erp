import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable HR data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "hr", "view")
    const employees = await prisma.employee.findMany({
      where: { orgId: org.id },
      include: { position: true },
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ employees })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load employees")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const { name, email, phone, department, position, startDate, status, salary } = body || {}

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    let positionId: string | undefined
    if (position) {
      const title = String(position).trim()
      const departmentName = String(department || "Operations").trim()
      const existing = await prisma.position.findFirst({ where: { orgId: org.id, title, department: departmentName } })
      const saved =
        existing ||
        (await prisma.position.create({
          data: { orgId: org.id, title, department: departmentName, headcount: 1, status: "open" },
        }))
      positionId = saved.id
    }

    const employee = await prisma.employee.create({
      data: {
        orgId: org.id,
        name: String(name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: phone ? String(phone).trim() : null,
        department: department ? String(department).trim() : null,
        positionId,
        startDate: startDate ? new Date(startDate) : null,
        status: status ? String(status).trim().toLowerCase() : "active",
        salary: Number(salary || 0),
      },
      include: { position: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created employee",
      entity: "Employee",
      entityId: employee.id,
      metadata: { name: employee.name, department: employee.department },
    })

    return NextResponse.json({ employee })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create employee")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const { id, name, email, phone, department, position, startDate, status, salary } = body || {}

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingEmployee = await prisma.employee.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    let positionId: string | null | undefined
    if (position === "") {
      positionId = null
    } else if (position) {
      const title = String(position).trim()
      const departmentName = String(department || "Operations").trim()
      const existing = await prisma.position.findFirst({ where: { orgId: org.id, title, department: departmentName } })
      const saved =
        existing ||
        (await prisma.position.create({
          data: { orgId: org.id, title, department: departmentName, headcount: 1, status: "open" },
        }))
      positionId = saved.id
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : undefined,
        email: email === "" ? null : email ? String(email).trim().toLowerCase() : undefined,
        phone: phone === "" ? null : phone ? String(phone).trim() : undefined,
        department: department === "" ? null : department ? String(department).trim() : undefined,
        ...(positionId !== undefined ? { positionId } : {}),
        startDate: startDate === "" ? null : startDate ? new Date(startDate) : undefined,
        status: status ? String(status).trim().toLowerCase() : undefined,
        salary: salary !== undefined ? Number(salary || 0) : undefined,
      },
      include: { position: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated employee",
      entity: "Employee",
      entityId: employee.id,
      metadata: { name: employee.name, department: employee.department },
    })

    return NextResponse.json({ employee })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update employee")
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

    const existingEmployee = await prisma.employee.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingEmployee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const employee = await prisma.employee.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted employee",
      entity: "Employee",
      entityId: employee.id,
      metadata: { name: employee.name },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete employee")
  }
}
