import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { requireAdminRequest } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable settings." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireAdminRequest(request, { requireWorkspaceOwner: true })
    const users = await prisma.user.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, title: true, twoFactorEnabled: true, createdAt: true },
    })
    return NextResponse.json({ org, users })
  } catch (error) {
    console.error("Settings fetch failed", error)
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireAdminRequest(request, { requireWorkspaceOwner: true })
    const body = await request.json()
    const { name, theme, notifyEmail } = body || {}
    const updated = await prisma.org.update({
      where: { id: org.id },
      data: { name: name ?? org.name, theme: theme ?? org.theme, notifyEmail: notifyEmail ?? org.notifyEmail },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "settings.org.updated",
      entity: "Org",
      entityId: org.id,
      metadata: { name: updated.name, theme: updated.theme, notifyEmail: updated.notifyEmail },
    })
    return NextResponse.json({ org: updated })
  } catch (error) {
    console.error("Settings update failed", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  void request
  return NextResponse.json(
    { error: "User creation moved to /api/admin/users. This legacy route is disabled." },
    { status: 410 },
  )
}
