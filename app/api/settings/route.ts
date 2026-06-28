import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { buildModuleAccessForUser, getDefaultAccessProfileForRole } from "@/lib/access-control"
import { canAssignRole, getAssignableRoles } from "@/lib/authz"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"

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
    return handleAccessRouteError(error, "Failed to load settings")
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
    return handleAccessRouteError(error, "Failed to update settings")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireAdminRequest(request)
    const body = await request.json()
    const { name, email, role } = body || {}
    if (!name || !email || !role) return NextResponse.json({ error: "name, email, role required" }, { status: 400 })
    const normalizedRole = String(role).trim().toUpperCase() as Role
    const assignableRoles = getAssignableRoles(user.role, user.email)
    if (!assignableRoles.includes(normalizedRole)) {
      return NextResponse.json({ error: `Only ${assignableRoles.join(", ")} can be created here` }, { status: 400 })
    }
    if (!canAssignRole({ actorRole: user.role, actorEmail: user.email, nextRole: normalizedRole })) {
      return NextResponse.json({ error: "Not authorized to assign that role" }, { status: 403 })
    }
    const accessProfile = getDefaultAccessProfileForRole(normalizedRole)
    const createdUser = await prisma.user.create({
      data: {
        name,
        email: String(email).toLowerCase(),
        role: normalizedRole,
        accessProfile,
        twoFactorBackupCodes: [],
        moduleAccess: buildModuleAccessForUser({ role: normalizedRole, accessProfile }),
        orgId: org.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accessProfile: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "settings.user.created",
      entity: "User",
      entityId: createdUser.id,
      metadata: { email: createdUser.email, role: createdUser.role },
    })
    return NextResponse.json({ user: createdUser })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    return handleAccessRouteError(error, "Failed to invite user")
  }
}
