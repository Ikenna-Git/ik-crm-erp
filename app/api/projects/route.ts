import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { seedProjectData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable project data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "projects", "view")
    await seedProjectData(org.id)
    const projects = await prisma.project.findMany({
      where: { orgId: org.id },
      include: { tasks: true },
      orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
    })
    return NextResponse.json({ projects })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load projects")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "projects", "manage")
    const body = await request.json()
    const { name, description, client, status, progress, team, budget, spent, startDate, endDate, priority } = body || {}
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        orgId: org.id,
        name: String(name).trim(),
        description: description ? String(description).trim() : "",
        client: client ? String(client).trim() : null,
        status: status ? String(status).trim().toLowerCase() : "planning",
        progress: Number(progress || 0),
        team: Number(team || 0),
        budget: Number(budget || 0),
        spent: Number(spent || 0),
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority ? String(priority).trim().toLowerCase() : "medium",
      },
      include: { tasks: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created project",
      entity: "Project",
      entityId: project.id,
      metadata: { name: project.name, status: project.status },
    })

    return NextResponse.json({ project })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create project")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "projects", "manage")
    const body = await request.json()
    const { id, name, description, client, status, progress, team, budget, spent, startDate, endDate, priority } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        client: client !== undefined ? (client ? String(client).trim() : null) : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
        progress: progress !== undefined ? Number(progress || 0) : undefined,
        team: team !== undefined ? Number(team || 0) : undefined,
        budget: budget !== undefined ? Number(budget || 0) : undefined,
        spent: spent !== undefined ? Number(spent || 0) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        priority: priority !== undefined ? String(priority).trim().toLowerCase() : undefined,
      },
      include: { tasks: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated project",
      entity: "Project",
      entityId: project.id,
      metadata: { name: project.name, status: project.status },
    })

    return NextResponse.json({ project })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update project")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "projects", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = await prisma.project.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted project",
      entity: "Project",
      entityId: project.id,
      metadata: { name: project.name },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete project")
  }
}
