import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable client portal." }, { status: 503 })

const generateAccessCode = () => Math.random().toString(36).slice(2, 10)

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "portal", "view")
    const portals = await prisma.clientPortal.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 3 },
        documents: { orderBy: { createdAt: "desc" }, take: 3 },
      },
    })
    return NextResponse.json({ portals })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load client portals")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "portal", "manage")
    const body = await request.json()
    const { name, contactName, contactEmail, summary } = body || {}
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })

    const portal = await prisma.clientPortal.create({
      data: {
        orgId: org.id,
        name,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        summary: summary || null,
        accessCode: generateAccessCode(),
        status: "ACTIVE",
      },
    })

    await prisma.clientPortalUpdate.create({
      data: {
        orgId: org.id,
        portalId: portal.id,
        userId: user.id,
        title: "Portal created",
        message: summary || "Client portal created and ready for updates.",
        status: portal.status,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created client portal",
      entity: "ClientPortal",
      entityId: portal.id,
      metadata: { name: portal.name, contactEmail: portal.contactEmail },
    })

    return NextResponse.json({ portal })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create client portal")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "portal", "manage")
    const body = await request.json()
    const { id, status, summary } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      normalizedStatus && ["ACTIVE", "PAUSED", "ARCHIVED"].includes(normalizedStatus) ? normalizedStatus : undefined

    const portal = await prisma.clientPortal.update({
      where: { id },
      data: {
        status: safeStatus,
        summary: summary ?? undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated client portal",
      entity: "ClientPortal",
      entityId: portal.id,
      metadata: { status: portal.status },
    })

    return NextResponse.json({ portal })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update client portal")
  }
}
