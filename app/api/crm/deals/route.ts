import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { createDecisionTrail, dealSnapshot } from "@/lib/decision-trails"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const deals = await prisma.deal.findMany({
      where: { orgId: org.id },
      include: { company: true },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ deals })
  } catch (error) {
    console.error("CRM deals fetch failed", error)
    return NextResponse.json({ error: "Failed to load deals" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, value, stage, company, companyId, contactId, ownerId, expectedClose } = body || {}
    if (!title || typeof value !== "number") {
      return NextResponse.json({ error: "Title and numeric value required" }, { status: 400 })
    }

    let resolvedCompanyId = companyId
    if (!resolvedCompanyId && company) {
      const existing = await prisma.company.findFirst({ where: { orgId: org.id, name: company } })
      const created = existing || (await prisma.company.create({ data: { name: company, orgId: org.id } }))
      resolvedCompanyId = created.id
    }

    const normalizedStage = typeof stage === "string" ? stage.toUpperCase() : "PROSPECT"
    const safeStage = (["PROSPECT", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].includes(normalizedStage)
      ? normalizedStage
      : "PROSPECT") as any

    const deal = await prisma.deal.create({
      data: {
        title,
        value,
        stage: safeStage,
        companyId: resolvedCompanyId,
        contactId,
        ownerId,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        orgId: org.id,
      },
      include: { company: true },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created deal",
      entity: "Deal",
      entityId: deal.id,
      metadata: { title: deal.title, value: deal.value, stage: deal.stage },
    })

    return NextResponse.json({ deal })
  } catch (error) {
    console.error("CRM deal create failed", error)
    return NextResponse.json({ error: "Failed to create deal" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, title, value, stage, company, companyId, contactId, ownerId, expectedClose } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    let resolvedCompanyId = companyId
    if (!resolvedCompanyId && company) {
      const existing = await prisma.company.findFirst({ where: { orgId: org.id, name: company } })
      const created = existing || (await prisma.company.create({ data: { name: company, orgId: org.id } }))
      resolvedCompanyId = created.id
    }

    const normalizedStage = typeof stage === "string" ? stage.toUpperCase() : undefined
    const safeStage =
      (normalizedStage && ["PROSPECT", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].includes(normalizedStage)
        ? normalizedStage
        : undefined) as any

    const previous = await prisma.deal.findUnique({ where: { id } })
    const updated = await prisma.deal.update({
      where: { id },
      data: {
        title,
        value: typeof value === "number" ? value : undefined,
        stage: safeStage,
        companyId: resolvedCompanyId,
        contactId,
        ownerId,
        expectedClose: expectedClose ? new Date(expectedClose) : undefined,
      },
      include: { company: true },
    })
    if (previous) {
      await createDecisionTrail({
        orgId: org.id,
        userId: user.id,
        action: "Updated deal",
        entity: "Deal",
        entityId: updated.id,
        before: dealSnapshot(previous),
        after: dealSnapshot(updated),
      })
    }
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated deal",
      entity: "Deal",
      entityId: updated.id,
      metadata: { title: updated.title, value: updated.value, stage: updated.stage },
    })

    return NextResponse.json({ deal: updated })
  } catch (error) {
    console.error("CRM deal update failed", error)
    return NextResponse.json({ error: "Failed to update deal" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const deleted = await prisma.deal.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted deal",
      entity: "Deal",
      entityId: deleted.id,
      metadata: { title: deleted.title, value: deleted.value, stage: deleted.stage },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CRM deal delete failed", error)
    return NextResponse.json({ error: "Failed to delete deal" }, { status: 500 })
  }
}
