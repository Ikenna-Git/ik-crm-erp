import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL to enable bootstrap data." },
      { status: 503 },
    )
  }
  try {
    const { org } = await getUserFromRequest(request)
    const [contacts, companies, deals, tasks, invoices, expenses] = await Promise.all([
      prisma.contact.findMany({ where: { orgId: org.id } }),
      prisma.company.findMany({ where: { orgId: org.id } }),
      prisma.deal.findMany({ where: { orgId: org.id } }),
      prisma.task.findMany({ where: { orgId: org.id } }),
      prisma.invoice.findMany({ where: { orgId: org.id } }),
      prisma.expense.findMany({ where: { orgId: org.id } }),
    ])
    return NextResponse.json({ org, contacts, companies, deals, tasks, invoices, expenses })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Bootstrap load failed", error)
    return NextResponse.json({ error: "Failed to load bootstrap data" }, { status: 500 })
  }
}
