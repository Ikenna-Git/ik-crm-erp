import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable project data." }, { status: 503 })

type ProjectLinkInput = {
  label?: unknown
  url?: unknown
  category?: unknown
  note?: unknown
}

type NormalizedProjectLink = {
  label?: string
  url: string
  category?: string
  note?: string
}

type ProjectLinkError = { error: string }

const isProjectLinkError = (value: NormalizedProjectLink | ProjectLinkError | null): value is ProjectLinkError =>
  Boolean(value && "error" in value)

const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

const normalizeProjectLinks = (value: unknown, label: string) => {
  if (value === undefined) return { ok: true as const, links: undefined }
  if (!Array.isArray(value)) {
    return { ok: false as const, error: `${label} must be an array.` }
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const typed = item as ProjectLinkInput
      const textLabel = typeof typed.label === "string" ? typed.label.trim() : ""
      const url = typeof typed.url === "string" ? typed.url.trim() : ""
      const category = typeof typed.category === "string" ? typed.category.trim() : ""
      const note = typeof typed.note === "string" ? typed.note.trim() : ""
      if (!textLabel && !url && !category && !note) return null
      if (!url) return { error: `${label} must include a URL.` }
      if (!isSafeHttpUrl(url)) return { error: `${label} must use a valid http or https URL.` }
      return {
        label: textLabel || undefined,
        url,
        category: category || undefined,
        note: note || undefined,
      }
    })
    .filter(Boolean)

  const invalid = normalized.find(isProjectLinkError)
  if (invalid) {
    return { ok: false as const, error: invalid.error }
  }

  return { ok: true as const, links: normalized.filter((item): item is NormalizedProjectLink => Boolean(item && !("error" in item))) }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "projects", "view")
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
    const {
      name,
      description,
      client,
      ownerName,
      siteName,
      location,
      linkedRecords,
      proofLinks,
      externalLinks,
      customFields,
      status,
      progress,
      team,
      budget,
      spent,
      startDate,
      endDate,
      priority,
    } = body || {}
    const normalizedName = typeof name === "string" ? name.trim() : ""
    if (!normalizedName) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 })
    }
    const normalizedProofLinks = normalizeProjectLinks(proofLinks, "Project proof links")
    if (!normalizedProofLinks.ok) {
      return NextResponse.json({ error: normalizedProofLinks.error }, { status: 400 })
    }
    const normalizedExternalLinks = normalizeProjectLinks(externalLinks, "Project external links")
    if (!normalizedExternalLinks.ok) {
      return NextResponse.json({ error: normalizedExternalLinks.error }, { status: 400 })
    }
    const normalizedProgress = toFiniteNumber(progress ?? 0)
    const normalizedTeam = toFiniteNumber(team ?? 0)
    const normalizedBudget = toFiniteNumber(budget ?? 0)
    const normalizedSpent = toFiniteNumber(spent ?? 0)
    if ([normalizedProgress, normalizedTeam, normalizedBudget, normalizedSpent].some((value) => value === null)) {
      return NextResponse.json({ error: "Project totals must use valid numeric values." }, { status: 400 })
    }
    if ([normalizedProgress, normalizedTeam, normalizedBudget, normalizedSpent].some((value) => typeof value === "number" && value < 0)) {
      return NextResponse.json({ error: "Project totals cannot be negative." }, { status: 400 })
    }
    const parsedStartDate = parseDateInput(startDate, "Project start date")
    if (!parsedStartDate.ok) {
      return NextResponse.json({ error: parsedStartDate.error }, { status: 400 })
    }
    const parsedEndDate = parseDateInput(endDate, "Project end date")
    if (!parsedEndDate.ok) {
      return NextResponse.json({ error: parsedEndDate.error }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        orgId: org.id,
        name: normalizedName,
        description: description ? String(description).trim() : "",
        client: client ? String(client).trim() : null,
        ownerName: ownerName ? String(ownerName).trim() : null,
        siteName: siteName ? String(siteName).trim() : null,
        location: location ? String(location).trim() : null,
        linkedRecords: linkedRecords && typeof linkedRecords === "object" ? linkedRecords : undefined,
        proofLinks: normalizedProofLinks.links,
        externalLinks: normalizedExternalLinks.links,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        status: status ? String(status).trim().toLowerCase() : "planning",
        progress: normalizedProgress ?? 0,
        team: normalizedTeam ?? 0,
        budget: normalizedBudget ?? 0,
        spent: normalizedSpent ?? 0,
        startDate: parsedStartDate.date ?? null,
        endDate: parsedEndDate.date ?? null,
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
    const {
      id,
      name,
      description,
      client,
      ownerName,
      siteName,
      location,
      linkedRecords,
      proofLinks,
      externalLinks,
      customFields,
      status,
      progress,
      team,
      budget,
      spent,
      startDate,
      endDate,
      priority,
    } = body || {}
    if (!id) {
      return NextResponse.json({ error: "Project id is required." }, { status: 400 })
    }

    const existingProject = await prisma.project.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }
    const normalizedProofLinks = normalizeProjectLinks(proofLinks, "Project proof links")
    if (!normalizedProofLinks.ok) {
      return NextResponse.json({ error: normalizedProofLinks.error }, { status: 400 })
    }
    const normalizedExternalLinks = normalizeProjectLinks(externalLinks, "Project external links")
    if (!normalizedExternalLinks.ok) {
      return NextResponse.json({ error: normalizedExternalLinks.error }, { status: 400 })
    }
    const normalizedProgress = progress !== undefined ? toFiniteNumber(progress) : undefined
    const normalizedTeam = team !== undefined ? toFiniteNumber(team) : undefined
    const normalizedBudget = budget !== undefined ? toFiniteNumber(budget) : undefined
    const normalizedSpent = spent !== undefined ? toFiniteNumber(spent) : undefined
    if ([normalizedProgress, normalizedTeam, normalizedBudget, normalizedSpent].some((value) => value === null)) {
      return NextResponse.json({ error: "Project totals must use valid numeric values." }, { status: 400 })
    }
    if ([normalizedProgress, normalizedTeam, normalizedBudget, normalizedSpent].some((value) => typeof value === "number" && value < 0)) {
      return NextResponse.json({ error: "Project totals cannot be negative." }, { status: 400 })
    }
    const parsedStartDate = parseDateInput(startDate, "Project start date")
    if (!parsedStartDate.ok) {
      return NextResponse.json({ error: parsedStartDate.error }, { status: 400 })
    }
    const parsedEndDate = parseDateInput(endDate, "Project end date")
    if (!parsedEndDate.ok) {
      return NextResponse.json({ error: parsedEndDate.error }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        description: description !== undefined ? String(description).trim() : undefined,
        client: client !== undefined ? (client ? String(client).trim() : null) : undefined,
        ownerName: ownerName !== undefined ? (ownerName ? String(ownerName).trim() : null) : undefined,
        siteName: siteName !== undefined ? (siteName ? String(siteName).trim() : null) : undefined,
        location: location !== undefined ? (location ? String(location).trim() : null) : undefined,
        linkedRecords: linkedRecords !== undefined && typeof linkedRecords === "object" ? linkedRecords : undefined,
        proofLinks: normalizedProofLinks.links,
        externalLinks: normalizedExternalLinks.links,
        customFields: customFields !== undefined && typeof customFields === "object" ? customFields : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
        ...(normalizedProgress !== undefined ? { progress: normalizedProgress } : {}),
        ...(normalizedTeam !== undefined ? { team: normalizedTeam } : {}),
        ...(normalizedBudget !== undefined ? { budget: normalizedBudget } : {}),
        ...(normalizedSpent !== undefined ? { spent: normalizedSpent } : {}),
        startDate: parsedStartDate.date,
        endDate: parsedEndDate.date,
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
