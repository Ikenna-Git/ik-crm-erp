import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable follow-ups." }, { status: 503 })

const CONTACT_INACTIVITY_DAYS = 21
const DEAL_STALL_DAYS = 10

const daysBetween = (start: Date, end: Date) => Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

const buildSummary = async (orgId: string) => {
  const now = new Date()
  const contactCutoff = new Date(now)
  contactCutoff.setDate(contactCutoff.getDate() - CONTACT_INACTIVITY_DAYS)
  const dealCutoff = new Date(now)
  dealCutoff.setDate(dealCutoff.getDate() - DEAL_STALL_DAYS)

  const [contacts, deals] = await Promise.all([
    prisma.contact.findMany({
      where: {
        orgId,
        status: { in: ["LEAD", "PROSPECT"] },
        OR: [{ lastContact: null }, { lastContact: { lt: contactCutoff } }],
      },
      select: { id: true, name: true, email: true, phone: true, lastContact: true, createdAt: true, ownerId: true },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.deal.findMany({
      where: {
        orgId,
        stage: { in: ["PROPOSAL", "NEGOTIATION", "QUALIFIED"] },
        updatedAt: { lt: dealCutoff },
      },
      select: { id: true, title: true, stage: true, updatedAt: true, ownerId: true },
      orderBy: { updatedAt: "asc" },
    }),
  ])

  const inactiveContacts = contacts.map((contact) => {
    const lastTouch = contact.lastContact || contact.createdAt
    return {
      id: contact.id,
      label: contact.name,
      meta: `${daysBetween(lastTouch, now)} days idle`,
      daysIdle: daysBetween(lastTouch, now),
      ownerId: contact.ownerId,
    }
  })

  const stalledDeals = deals.map((deal) => ({
    id: deal.id,
    label: deal.title,
    meta: `${deal.stage.toLowerCase()} • ${daysBetween(deal.updatedAt, now)} days`,
    daysIdle: daysBetween(deal.updatedAt, now),
    ownerId: deal.ownerId,
  }))

  return {
    inactiveContacts: { count: inactiveContacts.length, items: inactiveContacts },
    stalledDeals: { count: stalledDeals.length, items: stalledDeals },
    generatedAt: now.toISOString(),
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const summary = await buildSummary(org.id)
    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Follow-up summary fetch failed", error)
    return NextResponse.json({ error: "Failed to load follow-up summary" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const summary = await buildSummary(org.id)
    const contactItems = summary.inactiveContacts.items
    const dealItems = summary.stalledDeals.items

    const existingTasks = await prisma.task.findMany({
      where: {
        orgId: org.id,
        status: "OPEN",
        OR: [
          { relatedType: "contact", relatedId: { in: contactItems.map((item) => item.id) } },
          { relatedType: "deal", relatedId: { in: dealItems.map((item) => item.id) } },
        ],
      },
      select: { relatedType: true, relatedId: true },
    })

    const existingSet = new Set(existingTasks.map((task) => `${task.relatedType}:${task.relatedId}`))
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 2)

    let createdContacts = 0
    let createdDeals = 0

    for (const contact of contactItems.slice(0, 25)) {
      const key = `contact:${contact.id}`
      if (existingSet.has(key)) continue
      await prisma.task.create({
        data: {
          orgId: org.id,
          title: `Follow up with ${contact.label}`,
          dueDate,
          status: "OPEN",
          relatedType: "contact",
          relatedId: contact.id,
          ownerId: contact.ownerId || undefined,
        },
      })
      createdContacts += 1
    }

    for (const deal of dealItems.slice(0, 25)) {
      const key = `deal:${deal.id}`
      if (existingSet.has(key)) continue
      await prisma.task.create({
        data: {
          orgId: org.id,
          title: `Review stalled deal: ${deal.label}`,
          dueDate,
          status: "OPEN",
          relatedType: "deal",
          relatedId: deal.id,
          ownerId: deal.ownerId || undefined,
          dealId: deal.id,
        },
      })
      createdDeals += 1
    }

    if (createdContacts + createdDeals > 0) {
      await prisma.notification.create({
        data: {
          orgId: org.id,
          userId: user.id,
          title: "Follow-up tasks generated",
          message: `Created ${createdContacts + createdDeals} follow-up tasks for inactive contacts and stalled deals.`,
          type: "SUCCESS",
          source: "CRM",
          channel: "FOLLOWUP",
        },
      })
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Generated smart follow-ups",
      entity: "Task",
      metadata: { createdContacts, createdDeals },
    })

    return NextResponse.json({
      created: { contacts: createdContacts, deals: createdDeals },
      summary,
    })
  } catch (error) {
    console.error("Follow-up generation failed", error)
    return NextResponse.json({ error: "Failed to generate follow-ups" }, { status: 500 })
  }
}
