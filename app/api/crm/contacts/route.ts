import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const contacts = await prisma.contact.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("CRM contacts fetch failed", error)
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
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
  } catch (error) {
    console.error("CRM contact create failed", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}
