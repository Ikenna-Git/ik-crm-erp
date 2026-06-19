import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { listApprovalItemsForOrg } from "@/lib/approval-requests"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { getWorkspaceSetupItems } from "@/lib/launch-readiness"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable setup readiness." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)

    const [contacts, companies, deals, users, approvals] = await Promise.all([
      prisma.contact.count({ where: { orgId: org.id } }),
      prisma.company.count({ where: { orgId: org.id } }),
      prisma.deal.count({ where: { orgId: org.id } }),
      prisma.user.count({ where: { orgId: org.id } }),
      listApprovalItemsForOrg(org.id).catch(() => []),
    ])

    const setupItems = getWorkspaceSetupItems({
      role: user.role,
      email: user.email,
      counts: {
        contacts,
        companies,
        deals,
        users,
        pendingApprovals: approvals.filter((item) => item.status === "pending").length,
        completedApprovals: approvals.filter((item) => item.status !== "pending").length,
      },
    })

    return NextResponse.json({
      workspace: {
        id: org.id,
        name: org.name,
        role: user.role,
      },
      setupItems,
    })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Setup readiness load failed", error)
    return NextResponse.json({ error: "Failed to load setup readiness" }, { status: 500 })
  }
}
