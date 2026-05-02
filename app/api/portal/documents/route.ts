import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable portal documents." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "portal", "view")
    const { searchParams } = new URL(request.url)
    const portalId = searchParams.get("portalId")
    if (!portalId) return NextResponse.json({ error: "portalId is required" }, { status: 400 })

    const documents = await prisma.clientPortalDocument.findMany({
      where: { orgId: org.id, portalId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })
    return NextResponse.json({ documents })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load portal documents")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "portal", "manage")
    const body = await request.json()
    const { portalId, title, url, fileType, bytes } = body || {}
    if (!portalId || !title || !url) {
      return NextResponse.json({ error: "portalId, title, and url are required" }, { status: 400 })
    }
    const portal = await prisma.clientPortal.findFirst({
      where: { id: portalId, orgId: org.id },
      select: { id: true },
    })
    if (!portal) {
      return NextResponse.json({ error: "Client portal not found" }, { status: 404 })
    }

    const document = await prisma.clientPortalDocument.create({
      data: {
        orgId: org.id,
        portalId: portal.id,
        title,
        url,
        fileType: fileType || null,
        bytes: typeof bytes === "number" ? bytes : null,
      },
    })

    await prisma.clientPortal.update({
      where: { id: portal.id },
      data: { updatedAt: new Date() },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Added portal document",
      entity: "ClientPortalDocument",
      entityId: document.id,
      metadata: { portalId: portal.id, title },
    })

    return NextResponse.json({ document })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to add portal document")
  }
}
