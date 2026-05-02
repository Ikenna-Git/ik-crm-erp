import { NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { isSuperAdmin } from "@/lib/authz"
import { getBillingProviderReadiness } from "@/lib/billing"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable founder status." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { user } = await getUserFromRequest(request)
    if (!isSuperAdmin(user.role)) {
      return NextResponse.json({ error: "Super admin access required" }, { status: 403 })
    }

    const startedAt = Date.now()

    const [inviteCount, missingNotifyCount, orgWorkflowSummary, privilegedWithout2FA, pendingUserActivations] = await Promise.all([
      prisma.verificationToken.count({
        where: {
          identifier: { startsWith: "invite:" },
          expires: { gt: new Date() },
        },
      }),
      prisma.org.count({
        where: {
          OR: [{ notifyEmail: null }, { notifyEmail: "" }],
        },
      }),
      prisma.org.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { automationWorkflows: true, users: true } },
        },
      }),
      prisma.user.count({
        where: {
          role: { in: ["ORG_OWNER", "ADMIN", "SUPER_ADMIN"] },
          twoFactorEnabled: false,
        },
      }),
      prisma.user.count({
        where: {
          passwordHash: null,
          accounts: { none: {} },
        },
      }),
    ])

    await withPrismaRetry("admin.platformStatus.health", () => prisma.$queryRaw`SELECT 1`, 2)
    const dbLatencyMs = Date.now() - startedAt

    const orgsWithoutAutomation = orgWorkflowSummary.filter((org) => org._count.automationWorkflows === 0).length
    const largestWorkspace = [...orgWorkflowSummary].sort((a, b) => b._count.users - a._count.users)[0] || null

    const authConfigured = Boolean(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_SECRET)
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS)
    const cloudinaryConfigured = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
    )
    const googleOauthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    const billingProviderReadiness = getBillingProviderReadiness()
    const billingReadyCount = Object.values(billingProviderReadiness).filter(Boolean).length
    const aiProviders = {
      openai: Boolean(process.env.OPENAI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
    }
    const aiProviderMode = process.env.AI_PROVIDER || "auto"
    const aiReadyCount = Object.values(aiProviders).filter(Boolean).length

    const readiness = [
      {
        id: "database",
        label: "Database connectivity",
        status: "healthy",
        detail: `Primary database is reachable. Health query completed in ${dbLatencyMs}ms.`,
      },
      {
        id: "auth",
        label: "Auth and session config",
        status: authConfigured ? "healthy" : "critical",
        detail: authConfigured
          ? "NEXTAUTH_URL and NEXTAUTH_SECRET are configured."
          : "Missing NEXTAUTH_URL or NEXTAUTH_SECRET will destabilize login, invites, or sessions.",
      },
      {
        id: "smtp",
        label: "Email delivery",
        status: smtpConfigured ? "healthy" : "warning",
        detail: smtpConfigured
          ? "SMTP credentials are present for invites, digests, and alert flows."
          : "SMTP is not fully configured yet. Invite sharing and automated alerts still rely on manual handling.",
      },
      {
        id: "cloudinary",
        label: "File uploads",
        status: cloudinaryConfigured ? "healthy" : "warning",
        detail: cloudinaryConfigured
          ? "Cloudinary is configured for portal and document uploads."
          : "Cloudinary is not fully configured. File-sharing flows will not feel production-ready.",
      },
      {
        id: "billing",
        label: "Billing provider readiness",
        status: billingReadyCount > 0 ? "healthy" : "warning",
        detail:
          billingReadyCount > 0
            ? `${billingReadyCount} billing provider${billingReadyCount === 1 ? "" : "s"} configured for future charging flows.`
            : "No billing provider credentials detected yet. Org-owner billing controls are live, but payments are not wired.",
      },
      {
        id: "ai",
        label: "AI provider readiness",
        status: aiReadyCount > 0 ? "healthy" : "warning",
        detail:
          aiReadyCount > 0
            ? `${aiReadyCount} provider${aiReadyCount === 1 ? "" : "s"} configured. Current mode: ${aiProviderMode}.`
            : "No external AI provider keys detected yet. The assistant can still fall back locally, but not at full quality.",
      },
      {
        id: "oauth",
        label: "Google sign-in",
        status: googleOauthConfigured ? "healthy" : "info",
        detail: googleOauthConfigured
          ? "Google OAuth credentials are configured."
          : "Google sign-in is not configured yet. Fine if launch is email-first, but still worth tracking.",
      },
    ] as const

    const watchlist = [
      {
        id: "invite-queue",
        title: "Pending activations",
        metric: `${pendingUserActivations} account${pendingUserActivations === 1 ? "" : "s"}`,
        detail: "Users created without completed password or OAuth activation are still waiting to come online.",
      },
      {
        id: "2fa-gaps",
        title: "Privileged users missing 2FA",
        metric: `${privilegedWithout2FA} admin${privilegedWithout2FA === 1 ? "" : "s"}`,
        detail: "These are the people who can make admin changes without a second factor yet.",
      },
      {
        id: "notify-gaps",
        title: "Workspaces with no alert inbox",
        metric: `${missingNotifyCount} workspace${missingNotifyCount === 1 ? "" : "s"}`,
        detail: "Critical notices do not have a shared destination in these organizations.",
      },
      {
        id: "automation-gaps",
        title: "Workspaces with zero workflows",
        metric: `${orgsWithoutAutomation} workspace${orgsWithoutAutomation === 1 ? "" : "s"}`,
        detail: "These teams still rely fully on manual operating routines.",
      },
    ]

    return NextResponse.json({
      readiness,
      watchlist,
      aiProviders,
      billingProviders: billingProviderReadiness,
      meta: {
        inviteCount,
        largestWorkspace: largestWorkspace
          ? { name: largestWorkspace.name, users: largestWorkspace._count.users }
          : null,
      },
    })
  } catch (error) {
    console.error("Platform status failed", error)
    return NextResponse.json({ error: "Failed to load founder platform status" }, { status: 500 })
  }
}
