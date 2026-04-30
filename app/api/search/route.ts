import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")?.toLowerCase() || ""
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const results: any[] = []

    // Search contacts
    if (!category || category === "crm" || category === "contacts") {
      const contacts = await prisma.contact.findMany({
        where: {
          orgId: session.user.orgId,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
            { company: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { company: true },
        take: limit
      })

      results.push(...contacts.map(contact => ({
        id: `contact-${contact.id}`,
        title: contact.name,
        subtitle: `Contact • ${contact.company?.name || 'No company'} • ${contact.email}`,
        category: "CRM",
        href: "/dashboard/crm",
        type: "contact"
      })))
    }

    // Search companies
    if (!category || category === "crm" || category === "companies") {
      const companies = await prisma.company.findMany({
        where: {
          orgId: session.user.orgId,
          name: { contains: query, mode: "insensitive" }
        },
        take: limit
      })

      results.push(...companies.map(company => ({
        id: `company-${company.id}`,
        title: company.name,
        subtitle: `Company • ${company.industry || 'No industry'}`,
        category: "CRM",
        href: "/dashboard/crm",
        type: "company"
      })))
    }

    // Search deals
    if (!category || category === "crm" || category === "deals") {
      const deals = await prisma.deal.findMany({
        where: {
          orgId: session.user.orgId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { contact: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { contact: true },
        take: limit
      })

      results.push(...deals.map(deal => ({
        id: `deal-${deal.id}`,
        title: deal.title,
        subtitle: `Deal • ${deal.stage} • ₦${deal.value?.toLocaleString() || '0'}`,
        category: "CRM",
        href: "/dashboard/crm",
        type: "deal"
      })))
    }

    // Search invoices
    if (!category || category === "accounting" || category === "invoices") {
      const invoices = await prisma.invoice.findMany({
        where: {
          orgId: session.user.orgId,
          OR: [
            { number: { contains: query } },
            { contact: { name: { contains: query, mode: "insensitive" } } }
          ]
        },
        include: { contact: true },
        take: limit
      })

      results.push(...invoices.map(invoice => ({
        id: `invoice-${invoice.id}`,
        title: `Invoice ${invoice.number}`,
        subtitle: `Invoice • ${invoice.status} • ₦${invoice.total?.toLocaleString() || '0'}`,
        category: "Accounting",
        href: "/dashboard/accounting",
        type: "invoice"
      })))
    }

    // Search tasks
    if (!category || category === "tasks") {
      const tasks = await prisma.task.findMany({
        where: {
          orgId: session.user.orgId,
          title: { contains: query, mode: "insensitive" }
        },
        take: limit
      })

      results.push(...tasks.map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `Task • ${task.status}`,
        category: "Tasks",
        href: "/dashboard/projects",
        type: "task"
      })))
    }

    return NextResponse.json({ results: results.slice(0, limit) })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}