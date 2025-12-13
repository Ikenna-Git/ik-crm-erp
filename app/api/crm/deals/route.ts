import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const deals = await prisma.deal.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ deals })
}

export async function POST(request: Request) {
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
}

export async function PATCH(request: Request) {
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
}
