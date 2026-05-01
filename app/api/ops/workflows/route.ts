import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable workflows." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "operations", "view")
    const workflows = await prisma.automationWorkflow.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ workflows })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load workflows")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "operations", "manage")
    const body = await request.json()
    const { name, trigger, action } = body || {}
    if (!name || !trigger || !action) {
      return NextResponse.json({ error: "name, trigger, and action are required" }, { status: 400 })
    }

    const workflow = await prisma.automationWorkflow.create({
      data: {
        orgId: org.id,
        userId: user.id,
        name,
        trigger,
        action,
        active: true,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created workflow",
      entity: "AutomationWorkflow",
      entityId: workflow.id,
      metadata: { name: workflow.name },
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create workflow")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "operations", "manage")
    const body = await request.json()
    const { id, active, name, trigger, action } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const workflow = await prisma.automationWorkflow.update({
      where: { id },
      data: {
        name: name ?? undefined,
        trigger: trigger ?? undefined,
        action: action ?? undefined,
        active: typeof active === "boolean" ? active : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated workflow",
      entity: "AutomationWorkflow",
      entityId: workflow.id,
      metadata: { active: workflow.active },
    })

    return NextResponse.json({ workflow })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update workflow")
  }
}
