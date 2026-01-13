import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable playbooks." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const runs = await prisma.playbookRun.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ runs })
  } catch (error) {
    console.error("Playbook runs fetch failed", error)
    return NextResponse.json({ error: "Failed to load playbooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { templateId, name, category, notes } = body || {}
    if (!templateId || !name || !category) {
      return NextResponse.json({ error: "templateId, name, category required" }, { status: 400 })
    }

    const run = await prisma.playbookRun.create({
      data: {
        orgId: org.id,
        userId: user.id,
        templateId,
        name,
        category,
        notes: notes || null,
        status: "ACTIVE",
        progress: 10,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Launched playbook",
      entity: "PlaybookRun",
      entityId: run.id,
      metadata: { name: run.name, category: run.category },
    })

    return NextResponse.json({ run })
  } catch (error) {
    console.error("Playbook create failed", error)
    return NextResponse.json({ error: "Failed to launch playbook" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, status, progress, notes } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      normalizedStatus && ["ACTIVE", "PAUSED", "COMPLETED"].includes(normalizedStatus) ? normalizedStatus : undefined

    const run = await prisma.playbookRun.update({
      where: { id },
      data: {
        status: safeStatus,
        progress: typeof progress === "number" ? Math.min(Math.max(progress, 0), 100) : undefined,
        notes: notes ?? undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated playbook run",
      entity: "PlaybookRun",
      entityId: run.id,
      metadata: { status: run.status, progress: run.progress },
    })

    return NextResponse.json({ run })
  } catch (error) {
    console.error("Playbook update failed", error)
    return NextResponse.json({ error: "Failed to update playbook" }, { status: 500 })
  }
}
