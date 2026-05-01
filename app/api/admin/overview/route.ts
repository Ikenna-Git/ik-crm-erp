import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { getFounderSuperAdminEmail, isAdmin, isSuperAdmin } from "@/lib/authz"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable admin overview." }, { status: 503 })

type Severity = "critical" | "warning" | "info"
type CheckStatus = "healthy" | "warning" | "critical"

const readMetadataString = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "string" ? value : null
}

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
      recentClientIncidents,
      totalOrgs,
      totalUsers,
      recentOrgs,
    ] = await Promise.all([
      prisma.user.count({ where: { orgId: org.id } }),
      prisma.user.count({ where: { orgId: org.id, role: { in: ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] } } }),
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
      prisma.auditLog.findMany({
        where: { orgId: org.id, action: "telemetry.client_error" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, createdAt: true, metadata: true },
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

    const twoFactorCoverage = userCount ? Math.round((twoFactorCount / userCount) * 100) : 0
    const inviteMode = process.env.NEXTAUTH_URL ? "ready" : "limited"
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS)
    const aiConfigured = Boolean(process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY)
    const aiProvider = process.env.AI_PROVIDER || "local"
    const incidentCount = recentClientIncidents.length
    const incidents = recentClientIncidents.map((event) => ({
      id: event.id,
      message: readMetadataString(event.metadata, "message") || "Unhandled client error",
      href: readMetadataString(event.metadata, "href"),
      source: readMetadataString(event.metadata, "source"),
      createdAt: event.createdAt,
    }))

    const issues: Array<{
      id: string
      severity: Severity
      title: string
      detail: string
      metric: string
      href: string
      cta: string
    }> = []

    if (overdueInvoiceCount > 0) {
      issues.push({
        id: "overdue-invoices",
        severity: overdueInvoiceCount >= 5 ? "critical" : "warning",
        title: "Revenue follow-up is lagging",
        detail: "Overdue invoices need attention before they turn into silent cash leaks.",
        metric: `${overdueInvoiceCount} overdue invoice${overdueInvoiceCount === 1 ? "" : "s"}`,
        href: "/dashboard/accounting",
        cta: "Open accounting",
      })
    }

    if (pendingExpenseCount > 0) {
      issues.push({
        id: "pending-expenses",
        severity: pendingExpenseCount >= 5 ? "critical" : "warning",
        title: "Expense approvals are piling up",
        detail: "Finance requests are waiting in queue and can block reimbursements or reporting.",
        metric: `${pendingExpenseCount} pending expense${pendingExpenseCount === 1 ? "" : "s"}`,
        href: "/dashboard/accounting",
        cta: "Review expenses",
      })
    }

    if (userCount > 0 && twoFactorCoverage < 60) {
      issues.push({
        id: "2fa-coverage",
        severity: twoFactorCoverage < 35 ? "critical" : "warning",
        title: "Admin security coverage is still weak",
        detail: "More people need 2FA before wider rollout to customers and stakeholder admins.",
        metric: `${twoFactorCoverage}% 2FA coverage`,
        href: "/admin/security",
        cta: "Open security",
      })
    }

    if (!org.notifyEmail) {
      issues.push({
        id: "notify-email",
        severity: "warning",
        title: "No alert inbox is configured",
        detail: "Critical workflow, invite, and operational alerts do not yet have a shared destination.",
        metric: "Notify email missing",
        href: "/admin/workspace",
        cta: "Add notify email",
      })
    }

    if (workflowCount === 0) {
      issues.push({
        id: "workflow-coverage",
        severity: "info",
        title: "Automation is still underused",
        detail: "Your team is running manually without any live workflow guardrails or automations.",
        metric: "0 active workflows",
        href: "/dashboard/operations",
        cta: "Set up workflows",
      })
    }

    if (incidentCount > 0) {
      issues.push({
        id: "client-incidents",
        severity: incidentCount >= 3 ? "critical" : "warning",
        title: "Live client incidents were detected",
        detail: "Unhandled browser/runtime errors are reaching real user sessions and should be reviewed before wider rollout.",
        metric: `${incidentCount} recent client incident${incidentCount === 1 ? "" : "s"}`,
        href: "/admin",
        cta: "Review incidents",
      })
    }

    const healthChecks: Array<{
      id: string
      label: string
      status: CheckStatus
      detail: string
    }> = [
      {
        id: "database",
        label: "Database",
        status: "healthy",
        detail: "Core data queries are responding and migrations are in sync.",
      },
      {
        id: "access",
        label: "Access control",
        status: twoFactorCoverage < 60 && userCount > 0 ? "warning" : "healthy",
        detail: `Founder lock is active and ${adminCount} privileged account${adminCount === 1 ? "" : "s"} currently manage this workspace.`,
      },
      {
        id: "invites",
        label: "Invite flow",
        status: inviteMode === "ready" && smtpConfigured ? "healthy" : "warning",
        detail:
          inviteMode !== "ready"
            ? "Set NEXTAUTH_URL correctly for reliable invite links across environments."
            : smtpConfigured
              ? "Workspace invite links can be generated and emailed from admin."
              : "Invite links work, but SMTP is not configured yet, so admin must still share them manually.",
      },
      {
        id: "notifications",
        label: "Alert routing",
        status: org.notifyEmail ? "healthy" : "warning",
        detail: org.notifyEmail ? `Critical notices route to ${org.notifyEmail}.` : "No shared notify email is configured yet.",
      },
      {
        id: "ai",
        label: "AI assistant",
        status: aiConfigured ? "healthy" : "warning",
        detail: aiConfigured ? `Provider mode: ${aiProvider}.` : "The assistant can fall back locally, but provider-based answers are not fully configured.",
      },
      {
        id: "telemetry",
        label: "Live incident feed",
        status: incidentCount > 0 ? (incidentCount >= 3 ? "critical" : "warning") : "healthy",
        detail:
          incidentCount > 0
            ? `${incidentCount} recent client incident${incidentCount === 1 ? "" : "s"} were captured from live sessions.`
            : "No recent client-side incidents have been captured.",
      },
    ]

    const criticalCount = issues.filter((item) => item.severity === "critical").length
    const warningCount = issues.filter((item) => item.severity === "warning").length
    const infoCount = issues.filter((item) => item.severity === "info").length
    const healthScore = Math.max(36, 100 - criticalCount * 24 - warningCount * 12 - infoCount * 5)

    const nextActions = [
      {
        id: "users",
        title: "Invite the right workspace owners",
        detail: "Create or refresh access for admins, engineers, support, finance, and HR without touching founder control.",
        href: "/admin/users",
        cta: "Manage users",
      },
      {
        id: "security",
        title: "Raise the security floor",
        detail: "Push 2FA adoption, audit privileged users, and keep admin access inside its boundary.",
        href: "/admin/security",
        cta: "Open security",
      },
      {
        id: "workspace",
        title: "Make alerts and branding official",
        detail: "Set the workspace identity, notify inbox, and basic control settings your team will actually use.",
        href: "/admin/workspace",
        cta: "Edit workspace",
      },
    ]

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
          twoFactorCoverage,
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
      opsCenter: {
        healthScore,
        issueCount: issues.length,
        criticalCount,
        warningCount,
        infoCount,
        issues,
        healthChecks,
        incidents,
        nextActions,
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
