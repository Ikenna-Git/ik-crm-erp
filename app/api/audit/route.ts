import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable audit logs." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const logs = await prisma.auditLog.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: true },
    })
    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Audit logs fetch failed", error)
    return NextResponse.json({ error: "Failed to load audit logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { action, entity, entityId, metadata } = body || {}
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 })
    }
    const log = await prisma.auditLog.create({
      data: {
        orgId: org.id,
        userId: user.id,
        action,
        entity: entity || null,
        entityId: entityId || null,
        metadata: metadata || null,
      },
      include: { user: true },
    })
    return NextResponse.json({ log })
  } catch (error) {
    console.error("Audit log create failed", error)
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
  }
}
