import { NextResponse } from "next/server"
import { isTransientPrismaError, prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable follow-ups." }, { status: 503 })
const isDev = process.env.NODE_ENV !== "production"

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

const buildEmptySummary = () => ({
  inactiveContacts: { count: 0, items: [] as FollowupItem[] },
  stalledDeals: { count: 0, items: [] as FollowupItem[] },
  generatedAt: new Date().toISOString(),
})

const buildSummarySafe = async (orgId: string) => {
  try {
    return await buildSummary(orgId)
  } catch (error) {
    console.error("Follow-up summary build failed; returning empty summary", error)
    return buildEmptySummary()
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

const resolveValidOwnersSafe = async (orgId: string, ids: Array<string | null | undefined>) => {
  try {
    return await resolveValidOwners(orgId, ids)
  } catch (error) {
    console.warn("Failed to resolve task owners, assigning unowned tasks", error)
    return new Set<string>()
  }
}

const findExistingOpenTasksSafe = async (
  orgId: string,
  relatedFilters: Array<{ relatedType: string; relatedId: { in: string[] } }>,
) => {
  try {
    if (relatedFilters.length === 0) return [] as Array<{ relatedType: string | null; relatedId: string | null }>
    return await prisma.task.findMany({
      where: {
        orgId,
        status: "OPEN",
        OR: relatedFilters,
      },
      select: { relatedType: true, relatedId: true },
    })
  } catch (error) {
    console.warn("Failed to load existing open follow-up tasks; continuing without dedupe", error)
    return [] as Array<{ relatedType: string | null; relatedId: string | null }>
  }
}

const normalizeOwnerId = (ownerId: string | null | undefined, validOwners: Set<string>) => {
  if (!ownerId) return undefined
  return validOwners.has(ownerId) ? ownerId : undefined
}

const formatCreateError = (prefix: string, error: unknown) => {
  const detail = error instanceof Error ? error.message : "Unknown error"
  return `${prefix}: ${detail}`
}

const buildSimulatedSummary = () => {
  const now = new Date().toISOString()
  return {
    inactiveContacts: {
      count: 4,
      items: [
        { id: "sim-c-1", label: "Northwind Procurement", meta: "34 days idle", daysIdle: 34, priority: "high" as const },
        { id: "sim-c-2", label: "Acme Holdings", meta: "52 days idle", daysIdle: 52, priority: "critical" as const },
        { id: "sim-c-3", label: "Blue Ridge Retail", meta: "24 days idle", daysIdle: 24, priority: "normal" as const },
        { id: "sim-c-4", label: "Zenith Logistics", meta: "46 days idle", daysIdle: 46, priority: "critical" as const },
      ],
    },
    stalledDeals: {
      count: 3,
      items: [
        { id: "sim-d-1", label: "Civis ERP rollout - Northwind", meta: "negotiation • 16 days", daysIdle: 16, priority: "high" as const },
        { id: "sim-d-2", label: "Payroll revamp - NovaWorks", meta: "proposal • 23 days", daysIdle: 23, priority: "critical" as const },
        { id: "sim-d-3", label: "CRM migration - Acme", meta: "qualified • 11 days", daysIdle: 11, priority: "normal" as const },
      ],
    },
    generatedAt: now,
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) {
    if (isDev) return NextResponse.json({ summary: buildSimulatedSummary(), simulated: true })
    return dbUnavailable()
  }
  try {
    const { org } = await getUserFromRequest(request)
    const summary = await buildSummarySafe(org.id)
    return NextResponse.json({ summary })
  } catch (error) {
    console.error("Follow-up summary fetch failed", error)
    if (isTransientPrismaError(error)) {
      if (isDev) return NextResponse.json({ summary: buildSimulatedSummary(), simulated: true })
      return NextResponse.json(
        { error: "Database connection is temporarily unavailable. Please retry in a moment." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: "Failed to load follow-up summary" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    if (isDev) {
      return NextResponse.json({
        created: { contacts: 4, deals: 3 },
        skipped: 0,
        summary: buildSimulatedSummary(),
        simulated: true,
      })
    }
    return dbUnavailable()
  }
  try {
    const { org, user } = await getUserFromRequest(request)
    const summary = await buildSummarySafe(org.id)
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

    const existingTasks = await findExistingOpenTasksSafe(org.id, relatedFilters)

    const existingSet = new Set(existingTasks.map((task) => `${task.relatedType || ""}:${task.relatedId || ""}`))
    const validOwners = await resolveValidOwnersSafe(org.id, [
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
    console.error("Follow-up generation failed", error)
    if (isTransientPrismaError(error)) {
      if (isDev) {
        return NextResponse.json({
          created: { contacts: 4, deals: 3 },
          skipped: 0,
          summary: buildSimulatedSummary(),
          simulated: true,
        })
      }
      return NextResponse.json(
        { error: "Database connection is temporarily unavailable. Please retry in a moment." },
        { status: 503 },
      )
    }
    const detail = error instanceof Error ? error.message : "Unknown error"
    const message =
      process.env.NODE_ENV === "development" ? `Failed to generate follow-ups: ${detail}` : "Failed to generate follow-ups"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
