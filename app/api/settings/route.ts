import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable settings." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const users = await prisma.user.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ org, users })
  } catch (error) {
    console.error("Settings fetch failed", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { name, theme, notifyEmail } = body || {}
    const org = await getDefaultOrg()
    const updated = await prisma.org.update({
      where: { id: org.id },
      data: { name: name ?? org.name, theme: theme ?? org.theme, notifyEmail: notifyEmail ?? org.notifyEmail },
    })
    return NextResponse.json({ org: updated })
  } catch (error) {
    console.error("Settings update failed", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { name, email, role } = body || {}
    if (!name || !email || !role) return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
    const org = await getDefaultOrg()
    const user = await prisma.user.create({
      data: { name, email, role, orgId: org.id },
    })
    return NextResponse.json({ user })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    console.error("Settings user create failed", error)
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
  }
}
