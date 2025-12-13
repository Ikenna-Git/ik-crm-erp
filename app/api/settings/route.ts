import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const users = await prisma.user.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ org, users })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { name, theme, notifyEmail } = body || {}
  const org = await getDefaultOrg()
  const updated = await prisma.org.update({
    where: { id: org.id },
    data: { name: name ?? org.name, theme: theme ?? org.theme, notifyEmail: notifyEmail ?? org.notifyEmail },
  })
  return NextResponse.json({ org: updated })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, role } = body || {}
  if (!name || !email || !role) return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
  const org = await getDefaultOrg()
  try {
    const user = await prisma.user.create({
      data: { name, email, role, orgId: org.id },
    })
    return NextResponse.json({ user })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    throw error
  }
}
