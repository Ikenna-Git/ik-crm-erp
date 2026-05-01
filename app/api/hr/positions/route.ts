import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { seedHrData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable positions data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "hr", "view")
    await seedHrData(org.id)
    const positions = await prisma.position.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ positions })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load positions")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const { title, department, headcount, status } = body || {}

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const position = await prisma.position.create({
      data: {
        orgId: org.id,
        title: String(title).trim(),
        department: department ? String(department).trim() : null,
        headcount: Number(headcount || 1),
        status: status ? String(status).trim().toLowerCase() : "open",
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created position",
      entity: "Position",
      entityId: position.id,
      metadata: { title: position.title, department: position.department },
    })

    return NextResponse.json({ position })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create position")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "hr", "manage")
    const body = await request.json()
    const { id, title, department, headcount, status } = body || {}

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingPosition = await prisma.position.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingPosition) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    const position = await prisma.position.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        department: department !== undefined ? (department ? String(department).trim() : null) : undefined,
        headcount: headcount !== undefined ? Number(headcount || 1) : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated position",
      entity: "Position",
      entityId: position.id,
      metadata: { title: position.title, department: position.department },
    })

    return NextResponse.json({ position })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update position")
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

    const existingPosition = await prisma.position.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingPosition) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    const position = await prisma.position.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted position",
      entity: "Position",
      entityId: position.id,
      metadata: { title: position.title, department: position.department },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete position")
  }
}
