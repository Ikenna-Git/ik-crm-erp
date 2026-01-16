import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, context: { params: { code: string } }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 })
  }
  try {
    const { code } = context.params
    const portal = await prisma.clientPortal.findUnique({
      where: { accessCode: code },
      include: {
        updates: { orderBy: { createdAt: "desc" }, take: 12 },
        documents: { orderBy: { createdAt: "desc" }, take: 12 },
      },
    })
    if (!portal) return NextResponse.json({ error: "Portal not found" }, { status: 404 })
    return NextResponse.json({
      portal: {
        id: portal.id,
        name: portal.name,
        contactName: portal.contactName,
        summary: portal.summary,
        status: portal.status,
        updatedAt: portal.updatedAt,
        updates: portal.updates,
        documents: portal.documents,
      },
    })
  } catch (error) {
    console.error("Portal fetch failed", error)
    return NextResponse.json({ error: "Failed to load portal" }, { status: 500 })
  }
}
