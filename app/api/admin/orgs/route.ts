import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest } from "@/lib/request-user"
import { isSuperAdmin } from "@/lib/authz"
import { issueSignupInvite, sendSignupInviteEmail } from "@/lib/invitations"
import { getPublicOrigin } from "@/lib/public-url"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable org management." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { user } = await getUserFromRequest(request)
    if (!isSuperAdmin(user.role)) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
    }

    const orgs = await prisma.org.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        theme: true,
        notifyEmail: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            contacts: true,
            employees: true,
            deals: true,
            invoices: true,
            automationWorkflows: true,
          },
        },
      },
    })

    return NextResponse.json({ orgs })
  } catch (error) {
    console.error("Org listing failed", error)
    return NextResponse.json({ error: "Failed to load organizations" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { user } = await getUserFromRequest(request)
    if (!isSuperAdmin(user.role)) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const orgName = String(body?.name || "").trim()
    const theme = String(body?.theme || "light").trim()
    const notifyEmail = String(body?.notifyEmail || "").trim()
    const adminName = String(body?.adminName || "").trim()
    const adminEmail = String(body?.adminEmail || "").trim().toLowerCase()

    if (!orgName || !adminName || !adminEmail) {
      return NextResponse.json({ error: "name, adminName, and adminEmail are required" }, { status: 400 })
    }

    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
      select: {
        id: true,
        orgId: true,
      },
    })

    if (existingAdmin) {
      return NextResponse.json(
        {
          error: "This admin email is already in use by another Civis account.",
        },
        { status: 409 },
      )
    }

    const created = await prisma.org.create({
      data: {
        name: orgName,
        theme: theme || "light",
        notifyEmail: notifyEmail || adminEmail,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            role: "ADMIN",
            title: "Workspace Admin",
          },
        },
      },
      select: {
        id: true,
        name: true,
        theme: true,
        notifyEmail: true,
        createdAt: true,
        users: {
          take: 1,
          select: { id: true, name: true, email: true, role: true, title: true },
        },
      },
    })

    const invite = await issueSignupInvite({
      orgId: created.id,
      email: adminEmail,
      origin: getPublicOrigin(request),
    })
    const initialAdmin = created.users[0]
    const delivery = await sendSignupInviteEmail({
      to: adminEmail,
      name: initialAdmin?.name || adminName,
      orgName: created.name,
      inviteUrl: invite.inviteUrl,
      expiresAt: invite.expiresAt,
      sentBy: user.name || user.email,
      role: "ADMIN",
    })

    await createAuditLog({
      orgId: created.id,
      userId: user.id,
      action: "admin.org.created",
      entity: "Org",
      entityId: created.id,
      metadata: { name: created.name, adminEmail },
    })

    return NextResponse.json({
      org: created,
      invite,
      delivery,
      message: delivery.sent
        ? "Workspace created and the initial admin invite email was sent."
        : delivery.skipped
          ? "Workspace created. SMTP is not configured yet, so share the initial admin invite link manually."
          : "Workspace created, but invite email delivery failed. Share the initial admin invite link manually.",
    })
  } catch (error) {
    console.error("Org creation failed", error)
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 })
  }
}
