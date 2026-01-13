import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { restoreDateField } from "@/lib/decision-trails"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable decision trails." }, { status: 503 })

const ensureObject = (value: any) => (value && typeof value === "object" ? value : null)

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const trail = await prisma.decisionTrail.findUnique({ where: { id } })
    if (!trail || trail.orgId !== org.id) {
      return NextResponse.json({ error: "Decision trail not found" }, { status: 404 })
    }
    if (trail.rolledBackAt) {
      return NextResponse.json({ error: "This decision has already been rolled back" }, { status: 400 })
    }

    const snapshot = ensureObject(trail.before)
    const entityId = trail.entityId

    if (!entityId) {
      return NextResponse.json({ error: "Decision trail is missing entityId" }, { status: 400 })
    }

    const updateMap: Record<string, () => Promise<any>> = {
      Contact: async () =>
        snapshot
          ? prisma.contact.update({
              where: { id: entityId },
              data: {
                ...snapshot,
                lastContact: restoreDateField(snapshot.lastContact),
              },
            })
          : prisma.contact.delete({ where: { id: entityId } }),
      Deal: async () =>
        snapshot
          ? prisma.deal.update({
              where: { id: entityId },
              data: {
                ...snapshot,
                expectedClose: restoreDateField(snapshot.expectedClose),
              },
            })
          : prisma.deal.delete({ where: { id: entityId } }),
      Invoice: async () =>
        snapshot
          ? prisma.invoice.update({
              where: { id: entityId },
              data: {
                ...snapshot,
                issueDate: restoreDateField(snapshot.issueDate),
                dueDate: restoreDateField(snapshot.dueDate),
              },
            })
          : prisma.invoice.delete({ where: { id: entityId } }),
      Expense: async () =>
        snapshot
          ? prisma.expense.update({
              where: { id: entityId },
              data: {
                ...snapshot,
                date: restoreDateField(snapshot.date),
              },
            })
          : prisma.expense.delete({ where: { id: entityId } }),
      Doc: async () =>
        snapshot
          ? prisma.doc.update({ where: { id: entityId }, data: snapshot })
          : prisma.doc.delete({ where: { id: entityId } }),
      GalleryItem: async () =>
        snapshot
          ? prisma.galleryItem.update({ where: { id: entityId }, data: snapshot })
          : prisma.galleryItem.delete({ where: { id: entityId } }),
    }

    const updater = updateMap[trail.entity]
    if (!updater) {
      return NextResponse.json({ error: "Rollback not supported for this entity" }, { status: 400 })
    }

    await updater()
    await prisma.decisionTrail.update({
      where: { id: trail.id },
      data: { rolledBackAt: new Date() },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: `Rolled back ${trail.entity}`,
      entity: trail.entity,
      entityId: entityId,
      metadata: { decisionId: trail.id },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Decision rollback failed", error)
    return NextResponse.json({ error: "Failed to roll back decision" }, { status: 500 })
  }
}
