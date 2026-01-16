import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable portal updates." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
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
    console.error("Portal updates fetch failed", error)
    return NextResponse.json({ error: "Failed to load portal updates" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { portalId, title, message, status } = body || {}
    if (!portalId || !title) {
      return NextResponse.json({ error: "portalId and title are required" }, { status: 400 })
    }

    const update = await prisma.clientPortalUpdate.create({
      data: {
        orgId: org.id,
        portalId,
        userId: user.id,
        title,
        message: message || null,
        status: status || null,
      },
    })

    if (status) {
      await prisma.clientPortal.update({
        where: { id: portalId },
        data: { status },
      })
    } else {
      await prisma.clientPortal.update({
        where: { id: portalId },
        data: { updatedAt: new Date() },
      })
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Added portal update",
      entity: "ClientPortalUpdate",
      entityId: update.id,
      metadata: { portalId },
    })

    return NextResponse.json({ update })
  } catch (error) {
    console.error("Portal update create failed", error)
    return NextResponse.json({ error: "Failed to create portal update" }, { status: 500 })
  }
}
