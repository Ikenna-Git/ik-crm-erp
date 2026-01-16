import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable portal documents." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
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
    console.error("Portal documents fetch failed", error)
    return NextResponse.json({ error: "Failed to load portal documents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { portalId, title, url, fileType, bytes } = body || {}
    if (!portalId || !title || !url) {
      return NextResponse.json({ error: "portalId, title, and url are required" }, { status: 400 })
    }

    const document = await prisma.clientPortalDocument.create({
      data: {
        orgId: org.id,
        portalId,
        title,
        url,
        fileType: fileType || null,
        bytes: typeof bytes === "number" ? bytes : null,
      },
    })

    await prisma.clientPortal.update({
      where: { id: portalId },
      data: { updatedAt: new Date() },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Added portal document",
      entity: "ClientPortalDocument",
      entityId: document.id,
      metadata: { portalId, title },
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Portal document create failed", error)
    return NextResponse.json({ error: "Failed to add portal document" }, { status: 500 })
  }
}
