import { NextResponse } from "next/server"
import { Role } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { canAssignRole, canDeleteUser, getAssignableRoles, isAdmin } from "@/lib/authz"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin management." }, { status: 503 })

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
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })
    return NextResponse.json({ users, assignableRoles: getAssignableRoles(user.role) })
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

    if (!name || !email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 })
    }

    if (!["USER", "ADMIN"].includes(normalized)) {
      return NextResponse.json({ error: "Only USER and ADMIN can be invited here" }, { status: 400 })
    }

    if (!canAssignRole({ actorRole: actor.role, actorEmail: actor.email, nextRole: normalized })) {
      return NextResponse.json({ error: "Not authorized to assign that role" }, { status: 403 })
    }

    const created = await prisma.user.create({
      data: {
        orgId: org.id,
        name,
        email,
        title: title || null,
        role: normalized,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: "admin.user.invited",
      entity: "User",
      entityId: created.id,
      metadata: { email: created.email, role: created.role },
    })

    return NextResponse.json({
      user: created,
      message: "User created. They can complete signup later with the same email address.",
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
    const { id, role } = body || {}
    if (!id || !role) {
      return NextResponse.json({ error: "id and role required" }, { status: 400 })
    }

    const normalized = String(role).toUpperCase() as Role
    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(normalized)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
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
      !canAssignRole({
        actorRole: actor.role,
        actorEmail: actor.email,
        targetRole: target.role,
        targetEmail: target.email,
        nextRole: normalized,
      })
    ) {
      return NextResponse.json({ error: "Not authorized to change that role" }, { status: 403 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role: normalized },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        title: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: "admin.user.role_updated",
      entity: "User",
      entityId: updated.id,
      metadata: { previousRole: target.role, nextRole: updated.role, targetEmail: updated.email },
    })

    return NextResponse.json({ user: updated })
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
