import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { getFounderSuperAdminEmail, isAdmin, isSuperAdmin } from "@/lib/authz"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin overview." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const [
      userCount,
      adminCount,
      twoFactorCount,
      contactCount,
      employeeCount,
      workflowCount,
      activePortalCount,
      overdueInvoiceCount,
      pendingExpenseCount,
      activeProjectCount,
      recentAuditEvents,
      totalOrgs,
      totalUsers,
      recentOrgs,
    ] = await Promise.all([
      prisma.user.count({ where: { orgId: org.id } }),
      prisma.user.count({ where: { orgId: org.id, role: { in: ["ADMIN", "SUPER_ADMIN"] } } }),
      prisma.user.count({ where: { orgId: org.id, twoFactorEnabled: true } }),
      prisma.contact.count({ where: { orgId: org.id } }),
      prisma.employee.count({ where: { orgId: org.id } }),
      prisma.automationWorkflow.count({ where: { orgId: org.id, active: true } }),
      prisma.clientPortal.count({ where: { orgId: org.id, status: "ACTIVE" } }),
      prisma.invoice.count({ where: { orgId: org.id, status: "OVERDUE" } }),
      prisma.expense.count({ where: { orgId: org.id, status: "PENDING" } }),
      prisma.project.count({ where: { orgId: org.id, status: { not: "completed" } } }).catch(() => 0),
      prisma.auditLog.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { id: true, action: true, entity: true, entityId: true, createdAt: true, metadata: true, userId: true },
      }),
      isSuperAdmin(user.role) ? prisma.org.count() : Promise.resolve(0),
      isSuperAdmin(user.role) ? prisma.user.count() : Promise.resolve(0),
      isSuperAdmin(user.role)
        ? prisma.org.findMany({
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              name: true,
              notifyEmail: true,
              createdAt: true,
              updatedAt: true,
              _count: { select: { users: true, contacts: true, deals: true, invoices: true } },
            },
          })
        : Promise.resolve([]),
    ])

    return NextResponse.json({
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        founderEmail: getFounderSuperAdminEmail(),
      },
      workspace: {
        org,
        summary: {
          userCount,
          adminCount,
          twoFactorCount,
          contactCount,
          employeeCount,
          workflowCount,
          activePortalCount,
          overdueInvoiceCount,
          pendingExpenseCount,
          activeProjectCount,
        },
        recentAuditEvents,
      },
      platform: isSuperAdmin(user.role)
        ? {
            totalOrgs,
            totalUsers,
            recentOrgs,
          }
        : null,
    })
  } catch (error) {
    console.error("Admin overview failed", error)
    return NextResponse.json({ error: "Failed to load admin overview" }, { status: 500 })
  }
}
