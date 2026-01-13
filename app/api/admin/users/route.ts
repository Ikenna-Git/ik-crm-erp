import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin management." }, { status: 503 })

const isAdmin = (role?: string | null) => role === "ADMIN" || role === "SUPER_ADMIN"
const isSuperAdmin = (role?: string | null) => role === "SUPER_ADMIN"

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    const users = await prisma.user.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, title: true, createdAt: true },
    })
    return NextResponse.json({ users })
  } catch (error) {
    console.error("Admin users fetch failed", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user: actor } = await getUserFromRequest(request)
    if (!isAdmin(actor.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { id, role } = body || {}
    if (!id || !role) {
      return NextResponse.json({ error: "id and role required" }, { status: 400 })
    }

    const normalized = String(role).toUpperCase()
    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(normalized)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (normalized === "SUPER_ADMIN" && !isSuperAdmin(actor.role)) {
      return NextResponse.json({ error: "Only super admins can assign SUPER_ADMIN" }, { status: 403 })
    }

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (target.orgId !== org.id) {
      return NextResponse.json({ error: "User does not belong to this org" }, { status: 403 })
    }
    if (target.role === "SUPER_ADMIN" && !isSuperAdmin(actor.role)) {
      return NextResponse.json({ error: "Only super admins can modify a SUPER_ADMIN" }, { status: 403 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: normalized },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error("Admin user update failed", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
