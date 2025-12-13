import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const contacts = await prisma.contact.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ contacts })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, phone, companyId, tags, ownerId, notes } = body || {}
  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 })
  }
  const org = await getDefaultOrg()
  const contact = await prisma.contact.create({
    data: {
      name,
      email,
      phone,
      companyId,
      tags,
      ownerId,
      notes,
      orgId: org.id,
    },
  })
  return NextResponse.json({ contact })
}
