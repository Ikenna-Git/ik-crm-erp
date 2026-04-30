import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest } from "@/lib/request-user"
import { isAdmin } from "@/lib/authz"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable workspace settings." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const [userCount, adminCount, crmFieldCount] = await Promise.all([
      prisma.user.count({ where: { orgId: org.id } }),
      prisma.user.count({ where: { orgId: org.id, role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
      prisma.crmField.count({ where: { orgId: org.id, archived: false } }),
    ])

    return NextResponse.json({
      org,
      summary: {
        userCount,
        adminCount,
        crmFieldCount,
      },
    })
  } catch (error) {
    console.error("Workspace settings fetch failed", error)
    return NextResponse.json({ error: "Failed to load workspace settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body?.name || "").trim()
    const theme = String(body?.theme || "").trim()
    const notifyEmail = String(body?.notifyEmail || "").trim()

    if (!name) {
      return NextResponse.json({ error: "Workspace name is required" }, { status: 400 })
    }

    const updated = await prisma.org.update({
      where: { id: org.id },
      data: {
        name,
        theme: theme || org.theme,
        notifyEmail: notifyEmail || null,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "admin.workspace.updated",
      entity: "Org",
      entityId: org.id,
      metadata: { name: updated.name, theme: updated.theme, notifyEmail: updated.notifyEmail },
    })

    return NextResponse.json({ org: updated })
  } catch (error) {
    console.error("Workspace settings update failed", error)
    return NextResponse.json({ error: "Failed to update workspace settings" }, { status: 500 })
  }
}
