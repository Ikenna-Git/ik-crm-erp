import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canViewFounderControls, getFounderSuperAdminEmail } from "@/lib/authz"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin security." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request)
    const showFounderControls = canViewFounderControls(user.role, user.email)

    const [users, recentAuditEvents] = await Promise.all([
      prisma.user.findMany({
        where: { orgId: org.id },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, action: true, entity: true, entityId: true, createdAt: true, metadata: true },
      }),
    ])

    const privilegedUsers = users.filter(
      (member) => member.role === "ORG_OWNER" || member.role === "ADMIN" || member.role === "SUPER_ADMIN",
    )
    const twoFactorCoverage = users.length ? Math.round((users.filter((member) => member.twoFactorEnabled).length / users.length) * 100) : 0

    return NextResponse.json({
      summary: {
        userCount: users.length,
        privilegedUserCount: privilegedUsers.length,
        twoFactorCoverage,
        founderEmail: showFounderControls ? getFounderSuperAdminEmail() : null,
        showFounderControls,
      },
      privilegedUsers,
      recentAuditEvents,
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load admin security")
  }
}
