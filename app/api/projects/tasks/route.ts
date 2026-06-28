import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable project tasks." }, { status: 503 })

type TaskProofLinkInput = {
  label?: unknown
  url?: unknown
  category?: unknown
  note?: unknown
}

type NormalizedTaskProofLink = {
  label?: string
  url: string
  category?: string
  note?: string
}

type TaskProofLinkError = { error: string }

const isTaskProofLinkError = (value: NormalizedTaskProofLink | TaskProofLinkError | null): value is TaskProofLinkError =>
  Boolean(value && "error" in value)

const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const parseDateInput = (value: unknown, label: string) => {
  if (value === undefined) return { ok: true as const, date: undefined }
  if (value === null || value === "") return { ok: true as const, date: null }
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const, error: `${label} must be a valid date.` }
  }
  return { ok: true as const, date: parsed }
}

const normalizeProofLinks = (value: unknown) => {
  if (value === undefined) return { ok: true as const, links: undefined }
  if (!Array.isArray(value)) {
    return { ok: false as const, error: "Task proof links must be an array." }
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const typed = item as TaskProofLinkInput
      const label = typeof typed.label === "string" ? typed.label.trim() : ""
      const url = typeof typed.url === "string" ? typed.url.trim() : ""
      const category = typeof typed.category === "string" ? typed.category.trim() : ""
      const note = typeof typed.note === "string" ? typed.note.trim() : ""
      if (!label && !url && !category && !note) return null
      if (!url) return { error: "Task proof links must include a URL." }
      if (!isSafeHttpUrl(url)) return { error: "Task proof links must use a valid http or https URL." }
      return {
        label: label || undefined,
        url,
        category: category || undefined,
        note: note || undefined,
      }
    })
    .filter(Boolean)

  const invalid = normalized.find(isTaskProofLinkError)
  if (invalid) {
    return { ok: false as const, error: invalid.error }
  }

  return { ok: true as const, links: normalized.filter((item): item is NormalizedTaskProofLink => Boolean(item && !("error" in item))) }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "projects", "view")
    const tasks = await prisma.projectTask.findMany({
      where: { orgId: org.id },
      include: { project: true },
      orderBy: [{ startDate: "desc" }, { updatedAt: "desc" }],
    })
    return NextResponse.json({ tasks })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load project tasks")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "projects", "manage")
    const body = await request.json()
    const { title, projectId, project, assignee, startDate, endDate, priority, stage, proofLinks } = body || {}
    const normalizedTitle = typeof title === "string" ? title.trim() : ""
    if (!normalizedTitle) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 })
    }
    const normalizedProofLinks = normalizeProofLinks(proofLinks)
    if (!normalizedProofLinks.ok) {
      return NextResponse.json({ error: normalizedProofLinks.error }, { status: 400 })
    }
    const parsedStartDate = parseDateInput(startDate, "Task start date")
    if (!parsedStartDate.ok) {
      return NextResponse.json({ error: parsedStartDate.error }, { status: 400 })
    }
    const parsedEndDate = parseDateInput(endDate, "Task end date")
    if (!parsedEndDate.ok) {
      return NextResponse.json({ error: parsedEndDate.error }, { status: 400 })
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
        title: normalizedTitle,
        assignee: assignee ? String(assignee).trim() : null,
        startDate: parsedStartDate.date ?? null,
        endDate: parsedEndDate.date ?? null,
        priority: priority ? String(priority).trim().toLowerCase() : "medium",
        stage: stage ? String(stage).trim().toLowerCase() : "todo",
        proofLinks: normalizedProofLinks.links,
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
    return handleAccessRouteError(error, "Failed to create project task")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "projects", "manage")
    const body = await request.json()
    const { id, title, projectId, project, assignee, startDate, endDate, priority, stage, proofLinks } = body || {}
    if (!id) {
      return NextResponse.json({ error: "Project task id is required." }, { status: 400 })
    }

    const existingTask = await prisma.projectTask.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingTask) {
      return NextResponse.json({ error: "Project task not found" }, { status: 404 })
    }
    const normalizedProofLinks = normalizeProofLinks(proofLinks)
    if (!normalizedProofLinks.ok) {
      return NextResponse.json({ error: normalizedProofLinks.error }, { status: 400 })
    }
    const parsedStartDate = parseDateInput(startDate, "Task start date")
    if (!parsedStartDate.ok) {
      return NextResponse.json({ error: parsedStartDate.error }, { status: 400 })
    }
    const parsedEndDate = parseDateInput(endDate, "Task end date")
    if (!parsedEndDate.ok) {
      return NextResponse.json({ error: parsedEndDate.error }, { status: 400 })
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
        startDate: parsedStartDate.date,
        endDate: parsedEndDate.date,
        priority: priority !== undefined ? String(priority).trim().toLowerCase() : undefined,
        stage: stage !== undefined ? String(stage).trim().toLowerCase() : undefined,
        proofLinks: normalizedProofLinks.links,
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
    return handleAccessRouteError(error, "Failed to update project task")
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
    return handleAccessRouteError(error, "Failed to delete project task")
  }
}
