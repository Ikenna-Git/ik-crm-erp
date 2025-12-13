import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const [contacts, companies, deals, tasks, invoices, expenses] = await Promise.all([
    prisma.contact.findMany({ where: { orgId: org.id } }),
    prisma.company.findMany({ where: { orgId: org.id } }),
    prisma.deal.findMany({ where: { orgId: org.id } }),
    prisma.task.findMany({ where: { orgId: org.id } }),
    prisma.invoice.findMany({ where: { orgId: org.id } }),
    prisma.expense.findMany({ where: { orgId: org.id } }),
  ])
  return NextResponse.json({ org, contacts, companies, deals, tasks, invoices, expenses })
}
