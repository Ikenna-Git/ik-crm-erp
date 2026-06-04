import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hasModuleAccess } from "@/lib/access-control"
import { handleAccessRouteError, requireAuthenticatedRequest } from "@/lib/access-route"

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL to enable bootstrap data." },
      { status: 503 },
    )
  }
  try {
    const { org, user } = await requireAuthenticatedRequest(request)
    const [contacts, companies, deals, tasks, invoices, expenses] = await Promise.all([
      hasModuleAccess(user, "crm", "view") ? prisma.contact.findMany({ where: { orgId: org.id } }) : Promise.resolve([]),
      hasModuleAccess(user, "crm", "view") ? prisma.company.findMany({ where: { orgId: org.id } }) : Promise.resolve([]),
      hasModuleAccess(user, "crm", "view") ? prisma.deal.findMany({ where: { orgId: org.id } }) : Promise.resolve([]),
      hasModuleAccess(user, "projects", "view")
        ? prisma.task.findMany({ where: { orgId: org.id } })
        : Promise.resolve([]),
      hasModuleAccess(user, "accounting", "view")
        ? prisma.invoice.findMany({ where: { orgId: org.id } })
        : Promise.resolve([]),
      hasModuleAccess(user, "accounting", "view")
        ? prisma.expense.findMany({ where: { orgId: org.id } })
        : Promise.resolve([]),
    ])
    return NextResponse.json({ org, contacts, companies, deals, tasks, invoices, expenses })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load bootstrap data")
  }
}
