import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const companies = await prisma.company.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ companies })
  } catch (error) {
    console.error("CRM companies fetch failed", error)
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { name, industry, size, ownerId } = body || {}
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }
    const org = await getDefaultOrg()
    const company = await prisma.company.create({
      data: { name, industry, size, ownerId, orgId: org.id },
    })
    return NextResponse.json({ company })
  } catch (error) {
    console.error("CRM company create failed", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}
