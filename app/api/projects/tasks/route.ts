import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { seedProjectData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable project tasks." }, { status: 503 })

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
    await seedProjectData(org.id)
    const tasks = await prisma.projectTask.findMany({
      where: { orgId: org.id },
      include: { project: true },
      orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    return handleError(error, "Failed to load project tasks")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, projectId, project, assignee, startDate, endDate, priority, stage } = body || {}
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    let resolvedProjectId: string | null = projectId || null
    if (!resolvedProjectId && project) {
      const savedProject = await prisma.project.findFirst({ where: { orgId: org.id, name: String(project).trim() } })
      resolvedProjectId = savedProject?.id || null
    }
    if (resolvedProjectId) {
      const scopedProject = await prisma.project.findFirst({
        where: { id: resolvedProjectId, orgId: org.id },
      })
      if (!scopedProject) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
    }

    const task = await prisma.projectTask.create({
      data: {
        orgId: org.id,
        projectId: resolvedProjectId,
        title: String(title).trim(),
        assignee: assignee ? String(assignee).trim() : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority ? String(priority).trim().toLowerCase() : "medium",
        stage: stage ? String(stage).trim().toLowerCase() : "todo",
      },
      include: { project: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created project task",
      entity: "ProjectTask",
      entityId: task.id,
      metadata: { title: task.title, stage: task.stage },
    })

    return NextResponse.json({ task })
  } catch (error) {
    return handleError(error, "Failed to create project task")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, title, projectId, project, assignee, startDate, endDate, priority, stage } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingTask = await prisma.projectTask.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingTask) {
      return NextResponse.json({ error: "Project task not found" }, { status: 404 })
    }

    let resolvedProjectId: string | null | undefined
    if (projectId !== undefined) {
      resolvedProjectId = projectId || null
    } else if (project !== undefined) {
      if (!project) {
        resolvedProjectId = null
      } else {
        const savedProject = await prisma.project.findFirst({ where: { orgId: org.id, name: String(project).trim() } })
        resolvedProjectId = savedProject?.id || null
      }
    }
    if (resolvedProjectId) {
      const scopedProject = await prisma.project.findFirst({
        where: { id: resolvedProjectId, orgId: org.id },
      })
      if (!scopedProject) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
    }

    const task = await prisma.projectTask.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        ...(resolvedProjectId !== undefined ? { projectId: resolvedProjectId } : {}),
        assignee: assignee !== undefined ? (assignee ? String(assignee).trim() : null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        priority: priority !== undefined ? String(priority).trim().toLowerCase() : undefined,
        stage: stage !== undefined ? String(stage).trim().toLowerCase() : undefined,
      },
      include: { project: true },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated project task",
      entity: "ProjectTask",
      entityId: task.id,
      metadata: { title: task.title, stage: task.stage },
    })

    return NextResponse.json({ task })
  } catch (error) {
    return handleError(error, "Failed to update project task")
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

    const existingTask = await prisma.projectTask.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingTask) {
      return NextResponse.json({ error: "Project task not found" }, { status: 404 })
    }

    const task = await prisma.projectTask.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted project task",
      entity: "ProjectTask",
      entityId: task.id,
      metadata: { title: task.title },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleError(error, "Failed to delete project task")
  }
}
