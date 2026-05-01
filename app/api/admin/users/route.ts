import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import {
  ACCESS_PROFILES,
  buildModuleAccessForUser,
  getDefaultAccessProfileForRole,
  normalizeAccessProfile,
  summarizeModuleAccess,
} from "@/lib/access-control"
import { canAssignRole, canDeleteUser, getAssignableRoles, isAdmin } from "@/lib/authz"
import { issueSignupInvite, sendSignupInviteEmail } from "@/lib/invitations"
import { getPublicOrigin } from "@/lib/public-url"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin management." }, { status: 503 })

const mapAdminUser = (user: {
  id: string
  name: string
  email: string
  role: Role
  accessProfile: string
  moduleAccess?: unknown
  title: string | null
  twoFactorEnabled: boolean
  createdAt: Date
  passwordHash?: string | null
  _count?: { accounts: number }
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  accessProfile: user.accessProfile,
  title: user.title,
  twoFactorEnabled: user.twoFactorEnabled,
  createdAt: user.createdAt,
  invitePending: !user.passwordHash && (user._count?.accounts || 0) === 0,
  accessSummary: summarizeModuleAccess(user),
})

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
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accessProfile: true,
        moduleAccess: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
        passwordHash: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    })
    return NextResponse.json({
      users: users.map(mapAdminUser),
      assignableRoles: getAssignableRoles(user.role),
      accessProfiles: ACCESS_PROFILES,
    })
  } catch (error) {
    console.error("Admin users fetch failed", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user: actor } = await getUserFromRequest(request)
    if (!isAdmin(actor.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const title = String(body?.title || "").trim()
    const normalized = String(body?.role || "USER").trim().toUpperCase() as Role
    const accessProfile = normalizeAccessProfile(body?.accessProfile || getDefaultAccessProfileForRole(normalized))
    const assignableRoles = getAssignableRoles(actor.role)

    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 })
    }

    if (!assignableRoles.includes(normalized)) {
      return NextResponse.json({ error: `Only ${assignableRoles.join(", ")} can be invited here` }, { status: 400 })
    }

    if (!canAssignRole({ actorRole: actor.role, actorEmail: actor.email, nextRole: normalized })) {
      return NextResponse.json({ error: "Not authorized to assign that role" }, { status: 403 })
    }

    const origin = getPublicOrigin(request)
    const existing = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        orgId: true,
        name: true,
        email: true,
        role: true,
        accessProfile: true,
        moduleAccess: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
        passwordHash: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    })

    if (existing && existing.orgId !== org.id) {
      return NextResponse.json({ error: "This email already belongs to another workspace" }, { status: 409 })
    }

    if (existing && (existing.passwordHash || existing._count.accounts > 0)) {
      return NextResponse.json({ error: "This teammate already has an active account" }, { status: 409 })
    }

    const created = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            name,
            title: title || null,
            role: normalized,
            accessProfile,
            moduleAccess: buildModuleAccessForUser({ role: normalized, accessProfile }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            accessProfile: true,
            moduleAccess: true,
            title: true,
            twoFactorEnabled: true,
            createdAt: true,
            passwordHash: true,
            _count: {
              select: {
                accounts: true,
              },
            },
          },
        })
      : await prisma.user.create({
          data: {
            orgId: org.id,
            name,
            email,
            title: title || null,
            role: normalized,
            accessProfile,
            moduleAccess: buildModuleAccessForUser({ role: normalized, accessProfile }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            accessProfile: true,
            moduleAccess: true,
            title: true,
            twoFactorEnabled: true,
            createdAt: true,
            passwordHash: true,
            _count: {
              select: {
                accounts: true,
              },
            },
          },
        })

    const invite = await issueSignupInvite({
      orgId: org.id,
      email: created.email,
      origin,
    })
    const delivery = await sendSignupInviteEmail({
      to: created.email,
      name: created.name,
      orgName: org.name,
      inviteUrl: invite.inviteUrl,
      expiresAt: invite.expiresAt,
      sentBy: actor.name || actor.email,
      role: created.role,
    })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: existing ? "admin.user.reinvited" : "admin.user.invited",
      entity: "User",
      entityId: created.id,
      metadata: { email: created.email, role: created.role, accessProfile: created.accessProfile },
    })

    return NextResponse.json({
      user: mapAdminUser(created),
      invite,
      delivery,
      message: delivery.sent
        ? existing
          ? "Invite email sent and signup link refreshed."
          : "User created and invite email sent."
        : delivery.skipped
          ? existing
            ? "Invite refreshed. SMTP is not configured yet, so share the new signup link manually."
            : "User created. SMTP is not configured yet, so share the invite link manually."
          : existing
            ? "Invite refreshed, but email delivery failed. Share the signup link manually."
            : "User created, but email delivery failed. Share the invite link manually.",
    })
  } catch (error) {
    console.error("Admin user invite failed", error)
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 })
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
    const { id, role, accessProfile } = body || {}
    if (!id || (role === undefined && accessProfile === undefined)) {
      return NextResponse.json({ error: "id and at least one update field are required" }, { status: 400 })
    }

    const normalized = role !== undefined ? (String(role).toUpperCase() as Role) : undefined
    if (normalized && !["USER", "ADMIN", "ORG_OWNER", "SUPER_ADMIN"].includes(normalized)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, orgId: true, role: true, accessProfile: true, email: true, name: true },
    })
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (target.orgId !== org.id) {
      return NextResponse.json({ error: "User does not belong to this org" }, { status: 403 })
    }

    if (
      !canAssignRole({
        actorRole: actor.role,
        actorEmail: actor.email,
        targetRole: target.role,
        targetEmail: target.email,
        nextRole: normalized || target.role,
      })
    ) {
      return NextResponse.json({ error: "Not authorized to change that role" }, { status: 403 })
    }

    const nextRole = normalized || target.role
    const nextAccessProfile =
      accessProfile !== undefined
        ? normalizeAccessProfile(accessProfile)
        : normalized
          ? getDefaultAccessProfileForRole(nextRole)
          : normalizeAccessProfile(target.accessProfile || getDefaultAccessProfileForRole(nextRole))

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: nextRole,
        accessProfile: nextAccessProfile,
        moduleAccess: buildModuleAccessForUser({ role: nextRole, accessProfile: nextAccessProfile }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accessProfile: true,
        moduleAccess: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
        passwordHash: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: "admin.user.role_updated",
      entity: "User",
      entityId: updated.id,
      metadata: {
        previousRole: target.role,
        nextRole: updated.role,
        accessProfile: updated.accessProfile,
        targetEmail: updated.email,
      },
    })

    return NextResponse.json({ user: mapAdminUser(updated) })
  } catch (error) {
    console.error("Admin user update failed", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user: actor } = await getUserFromRequest(request)
    if (!isAdmin(actor.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 })
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, orgId: true, role: true, email: true, name: true },
    })

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (target.orgId !== org.id) {
      return NextResponse.json({ error: "User does not belong to this org" }, { status: 403 })
    }

    if (
      !canDeleteUser({
        actorRole: actor.role,
        actorEmail: actor.email,
        actorUserId: actor.id,
        targetUserId: target.id,
        targetRole: target.role,
        targetEmail: target.email,
      })
    ) {
      return NextResponse.json({ error: "Not authorized to remove this user" }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: target.id } })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: "admin.user.removed",
      entity: "User",
      entityId: target.id,
      metadata: { email: target.email, role: target.role },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin user delete failed", error)
    return NextResponse.json({ error: "Failed to remove user" }, { status: 500 })
  }
}
