import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const companies = await prisma.company.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ companies })
}

export async function POST(request: Request) {
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
}
