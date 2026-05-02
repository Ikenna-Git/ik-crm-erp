import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable portal updates." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "portal", "view")
    const { searchParams } = new URL(request.url)
    const portalId = searchParams.get("portalId")
    if (!portalId) return NextResponse.json({ error: "portalId is required" }, { status: 400 })

    const updates = await prisma.clientPortalUpdate.findMany({
      where: { orgId: org.id, portalId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ updates })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load portal updates")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "portal", "manage")
    const body = await request.json()
    const { portalId, title, message, status } = body || {}
    if (!portalId || !title) {
      return NextResponse.json({ error: "portalId and title are required" }, { status: 400 })
    }
    const portal = await prisma.clientPortal.findFirst({
      where: { id: portalId, orgId: org.id },
      select: { id: true },
    })
    if (!portal) {
      return NextResponse.json({ error: "Client portal not found" }, { status: 404 })
    }

    const update = await prisma.clientPortalUpdate.create({
      data: {
        orgId: org.id,
        portalId: portal.id,
        userId: user.id,
        title,
        message: message || null,
        status: status || null,
      },
    })

    if (status) {
      await prisma.clientPortal.update({
        where: { id: portal.id },
        data: { status },
      })
    } else {
      await prisma.clientPortal.update({
        where: { id: portal.id },
        data: { updatedAt: new Date() },
      })
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Added portal update",
      entity: "ClientPortalUpdate",
      entityId: update.id,
      metadata: { portalId: portal.id },
    })

    return NextResponse.json({ update })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create portal update")
  }
}
