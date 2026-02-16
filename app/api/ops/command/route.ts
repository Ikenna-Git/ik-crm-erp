import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable ops insights." }, { status: 503 })

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org } = await getUserFromRequest(request)
    const now = new Date()
    const monthStart = startOfMonth(now)

    const [
      contactsCount,
      openDealsCount,
      pipelineValue,
      revenueMtd,
      expensesMtd,
      overdueInvoices,
      pendingExpenses,
      openTasks,
      recentAudit,
    ] = await Promise.all([
      prisma.contact.count({ where: { orgId: org.id } }),
      prisma.deal.count({ where: { orgId: org.id, stage: { notIn: ["WON", "LOST"] } } }),
      prisma.deal.aggregate({
        where: { orgId: org.id, stage: { notIn: ["LOST"] } },
        _sum: { value: true },
      }),
      prisma.invoice.aggregate({
        where: {
          orgId: org.id,
          status: "PAID",
          OR: [{ issueDate: { gte: monthStart } }, { issueDate: null, createdAt: { gte: monthStart } }],
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          orgId: org.id,
          OR: [{ date: { gte: monthStart } }, { date: null, createdAt: { gte: monthStart } }],
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { orgId: org.id, status: "OVERDUE" } }),
      prisma.expense.count({ where: { orgId: org.id, status: "PENDING" } }),
      prisma.task.count({
        where: { orgId: org.id, status: "OPEN", dueDate: { lt: now } },
      }),
      prisma.auditLog.findMany({
        where: { orgId: org.id },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ])

    const stats = {
      contacts: contactsCount,
      openDeals: openDealsCount,
      pipelineValue: pipelineValue._sum.value || 0,
      revenueMtd: revenueMtd._sum.amount || 0,
      expensesMtd: expensesMtd._sum.amount || 0,
      overdueInvoices,
      pendingExpenses,
      openTasks,
    }

    const decisions = []
    if (overdueInvoices > 0) {
      decisions.push({
        id: "dec-overdue",
        title: "Overdue invoices need attention",
        detail: `${overdueInvoices} invoices are overdue`,
        impact: "High",
        action: "Review invoices",
        href: "/dashboard/accounting",
      })
    }
    if (pendingExpenses > 0) {
      decisions.push({
        id: "dec-expenses",
        title: "Pending expenses awaiting approval",
        detail: `${pendingExpenses} expenses are pending`,
        impact: "Medium",
        action: "Approve expenses",
        href: "/dashboard/accounting",
      })
    }
    if (openTasks > 0) {
      decisions.push({
        id: "dec-tasks",
        title: "Overdue tasks need owners",
        detail: `${openTasks} tasks are past due`,
        impact: "Medium",
        action: "Check projects",
        href: "/dashboard/projects",
      })
    }

    const recentActivity = recentAudit.map((log) => ({
      id: log.id,
      title: log.action,
      detail: log.entity ? `${log.entity} • ${log.entityId || "update"}` : "System update",
      time: log.createdAt.toISOString(),
      status: "info",
    }))

    return NextResponse.json({
      stats,
      decisions,
      recentActivity,
    })
  } catch (error) {
    console.error("Ops command center fetch failed", error)
    const detail = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Failed to load ops command center: ${detail}`
            : "Failed to load ops command center",
      },
      { status: 503 },
    )
  }
}
