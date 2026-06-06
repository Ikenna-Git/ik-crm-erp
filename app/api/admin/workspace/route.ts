import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { canManageWorkspaceSettings, canViewFounderControls } from "@/lib/authz"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable workspace settings." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request)
    const showFounderControls = canViewFounderControls(user.role, user.email)

    const [userCount, adminCount, crmFieldCount] = await Promise.all([
      prisma.user.count({
        where: {
          orgId: org.id,
          ...(showFounderControls ? {} : { role: { not: "SUPER_ADMIN" } }),
        },
      }),
      prisma.user.count({
        where: {
          orgId: org.id,
          role: { in: showFounderControls ? ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] : ["ORG_OWNER", "ADMIN"] },
        },
      }),
      prisma.crmField.count({ where: { orgId: org.id, archived: false } }),
    ])

    return NextResponse.json({
      org,
      summary: {
        userCount,
        adminCount,
        crmFieldCount,
      },
      permissions: {
        canManageWorkspace: canManageWorkspaceSettings(user.role, user.email),
        canManageBilling: canManageWorkspaceSettings(user.role, user.email),
        isPlatformSuperAdmin: showFounderControls,
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load workspace settings")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request, { requireWorkspaceOwner: true })

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
    return handleAccessRouteError(error, "Failed to update workspace settings")
  }
}
