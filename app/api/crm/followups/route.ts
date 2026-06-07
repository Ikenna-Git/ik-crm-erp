import { NextResponse } from "next/server"
import { isTransientPrismaError, prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable follow-ups." }, { status: 503 })

const CONTACT_INACTIVITY_DAYS = 21
const DEAL_STALL_DAYS = 10

const daysBetween = (start: Date, end: Date) => Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

type FollowupPriority = "critical" | "high" | "normal"
type FollowupType = "contact" | "deal"

type FollowupItem = {
  id: string
  label: string
  meta: string
  daysIdle: number
  ownerId?: string | null
  priority: FollowupPriority
}

const priorityWeight: Record<FollowupPriority, number> = {
  critical: 3,
  high: 2,
  normal: 1,
}

const getPriority = (kind: FollowupType, daysIdle: number): FollowupPriority => {
  if (kind === "contact") {
    if (daysIdle >= 45) return "critical"
    if (daysIdle >= 30) return "high"
    return "normal"
  }

  if (daysIdle >= 20) return "critical"
  if (daysIdle >= 14) return "high"
  return "normal"
}

const sortByPriorityAndAge = <T extends FollowupItem>(items: T[]) =>
  [...items].sort((a, b) => {
    const priorityDelta = priorityWeight[b.priority] - priorityWeight[a.priority]
    if (priorityDelta !== 0) return priorityDelta
    const idleDelta = b.daysIdle - a.daysIdle
    if (idleDelta !== 0) return idleDelta
    return a.label.localeCompare(b.label)
  })

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
      select: { id: true, name: true, lastContact: true, createdAt: true, ownerId: true },
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

  const inactiveContacts = sortByPriorityAndAge(
    contacts.map((contact) => {
      const lastTouch = contact.lastContact || contact.createdAt
      const idleDays = daysBetween(lastTouch, now)
      return {
        id: contact.id,
        label: contact.name,
        meta: `${idleDays} days idle`,
        daysIdle: idleDays,
        ownerId: contact.ownerId,
        priority: getPriority("contact", idleDays),
      }
    }),
  )

  const stalledDeals = sortByPriorityAndAge(
    deals.map((deal) => {
      const idleDays = daysBetween(deal.updatedAt, now)
      return {
        id: deal.id,
        label: deal.title,
        meta: `${deal.stage.toLowerCase()} • ${idleDays} days`,
        daysIdle: idleDays,
        ownerId: deal.ownerId,
        priority: getPriority("deal", idleDays),
      }
    }),
  )

  return {
    inactiveContacts: { count: inactiveContacts.length, items: inactiveContacts },
    stalledDeals: { count: stalledDeals.length, items: stalledDeals },
    generatedAt: now.toISOString(),
  }
}

const resolveValidOwners = async (orgId: string, ids: Array<string | null | undefined>) => {
  const ownerIds = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (ownerIds.length === 0) return new Set<string>()

  const existingOwners = await prisma.user.findMany({
    where: {
      orgId,
      id: { in: ownerIds },
    },
    select: { id: true },
  })
  return new Set(existingOwners.map((owner) => owner.id))
}

const findExistingOpenTasks = async (
  orgId: string,
  relatedFilters: Array<{ relatedType: string; relatedId: { in: string[] } }>,
) => {
  if (relatedFilters.length === 0) return [] as Array<{ relatedType: string | null; relatedId: string | null }>
  return prisma.task.findMany({
    where: {
      orgId,
      status: "OPEN",
      OR: relatedFilters,
    },
    select: { relatedType: true, relatedId: true },
  })
}

const normalizeOwnerId = (ownerId: string | null | undefined, validOwners: Set<string>) => {
  if (!ownerId) return undefined
  return validOwners.has(ownerId) ? ownerId : undefined
}

const formatCreateError = (prefix: string, error: unknown) => {
  const detail = error instanceof Error ? error.message : "Unknown error"
  return `${prefix}: ${detail}`
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "crm", "view")
    const summary = await buildSummary(org.id)
    return NextResponse.json({ summary })
  } catch (error) {
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database connection is temporarily unavailable. Please retry in a moment." },
        { status: 503 },
      )
    }
    return handleAccessRouteError(error, "Failed to load follow-up summary")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "crm", "manage")
    const summary = await buildSummary(org.id)
    const contactItems = summary.inactiveContacts.items
    const dealItems = summary.stalledDeals.items

    if (!contactItems.length && !dealItems.length) {
      return NextResponse.json({
        created: { contacts: 0, deals: 0 },
        skipped: 0,
        summary,
      })
    }

    const relatedFilters: Array<{ relatedType: string; relatedId: { in: string[] } }> = []
    if (contactItems.length) {
      relatedFilters.push({ relatedType: "contact", relatedId: { in: contactItems.map((item) => item.id) } })
    }
    if (dealItems.length) {
      relatedFilters.push({ relatedType: "deal", relatedId: { in: dealItems.map((item) => item.id) } })
    }

    const existingTasks = await findExistingOpenTasks(org.id, relatedFilters)

    const existingSet = new Set(existingTasks.map((task) => `${task.relatedType || ""}:${task.relatedId || ""}`))
    const validOwners = await resolveValidOwners(org.id, [
      ...contactItems.map((item) => item.ownerId),
      ...dealItems.map((item) => item.ownerId),
    ])
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 2)

    let createdContacts = 0
    let createdDeals = 0
    const createErrors: string[] = []

    for (const contact of contactItems.slice(0, 25)) {
      const key = `contact:${contact.id}`
      if (existingSet.has(key)) continue
      try {
        await prisma.task.create({
          data: {
            orgId: org.id,
            title: `Follow up with ${contact.label}`,
            dueDate,
            status: "OPEN",
            relatedType: "contact",
            relatedId: contact.id,
            ownerId: normalizeOwnerId(contact.ownerId, validOwners),
          },
        })
        createdContacts += 1
      } catch (error) {
        console.error("Contact follow-up task create failed", error)
        createErrors.push(formatCreateError(`contact:${contact.id}`, error))
      }
    }

    for (const deal of dealItems.slice(0, 25)) {
      const key = `deal:${deal.id}`
      if (existingSet.has(key)) continue
      try {
        await prisma.task.create({
          data: {
            orgId: org.id,
            title: `Review stalled deal: ${deal.label}`,
            dueDate,
            status: "OPEN",
            relatedType: "deal",
            relatedId: deal.id,
            ownerId: normalizeOwnerId(deal.ownerId, validOwners),
            dealId: deal.id,
          },
        })
        createdDeals += 1
      } catch (error) {
        console.error("Deal follow-up task create failed", error)
        createErrors.push(formatCreateError(`deal:${deal.id}`, error))
      }
    }

    if (createdContacts + createdDeals > 0) {
      try {
        await prisma.notification.create({
          data: {
            orgId: org.id,
            userId: user.id,
            title: "Follow-up tasks generated",
            message: `Created ${createdContacts + createdDeals} follow-up tasks for inactive contacts and stalled deals.`,
            type: "SUCCESS",
            source: "CRM",
            channel: "in-app",
          },
        })
      } catch (notificationError) {
        console.warn("Follow-up notification create failed", notificationError)
      }
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Generated smart follow-ups",
      entity: "Task",
      metadata: { createdContacts, createdDeals, skipped: createErrors.length },
    })

    return NextResponse.json({
      created: { contacts: createdContacts, deals: createdDeals },
      skipped: createErrors.length,
      summary,
      errors: process.env.NODE_ENV === "development" ? createErrors.slice(0, 5) : undefined,
    })
  } catch (error) {
    if (isTransientPrismaError(error)) {
      return NextResponse.json(
        { error: "Database connection is temporarily unavailable. Please retry in a moment." },
        { status: 503 },
      )
    }
    return handleAccessRouteError(error, "Failed to generate follow-ups")
  }
}
