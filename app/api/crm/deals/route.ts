import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const deals = await prisma.deal.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ deals })
  } catch (error) {
    console.error("CRM deals fetch failed", error)
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { title, value, stage, companyId, contactId, ownerId, expectedClose } = body || {}
    if (!title || typeof value !== "number") {
      return NextResponse.json({ error: "Title and numeric value required" }, { status: 400 })
    }
    const org = await getDefaultOrg()
    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        stage: stage || "PROSPECT",
        companyId,
        contactId,
        ownerId,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        orgId: org.id,
      },
    })
    return NextResponse.json({ deal })
  } catch (error) {
    console.error("CRM deal create failed", error)
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { id, stage } = body || {}
    if (!id || !stage) {
      return NextResponse.json({ error: "id and stage required" }, { status: 400 })
    }
    const updated = await prisma.deal.update({
      where: { id },
      data: { stage },
    })
    return NextResponse.json({ deal: updated })
  } catch (error) {
    console.error("CRM deal update failed", error)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}
