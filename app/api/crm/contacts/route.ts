import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { contactSnapshot, createDecisionTrail } from "@/lib/decision-trails"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const contacts = await prisma.contact.findMany({
      where: { orgId: org.id },
      include: { company: true },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ contacts })
  } catch (error) {
    console.error("CRM contacts fetch failed", error)
    return NextResponse.json({ error: "Failed to load contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { name, email, phone, company, status, revenue, lastContact, tags, ownerId, notes, customFields } = body || {}
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 })
    }

    let companyId: string | undefined
    if (company) {
      const existing = await prisma.company.findFirst({ where: { orgId: org.id, name: company } })
      const created = existing || (await prisma.company.create({ data: { name: company, orgId: org.id } }))
      companyId = created.id
    }

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "LEAD"
    const safeStatus = (["LEAD", "PROSPECT", "CUSTOMER"].includes(normalizedStatus) ? normalizedStatus : "LEAD") as any

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        companyId,
        tags,
        ownerId,
        notes,
        status: safeStatus,
        revenue: typeof revenue === "number" ? revenue : undefined,
        lastContact: lastContact ? new Date(lastContact) : undefined,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        orgId: org.id,
      },
      include: { company: true },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created contact",
      entity: "Contact",
      entityId: contact.id,
      metadata: { name: contact.name, email: contact.email },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("CRM contact create failed", error)
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, name, email, phone, company, status, revenue, lastContact, tags, ownerId, notes, customFields } = body || {}

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    let companyId: string | null | undefined
    if (company === "") {
      companyId = null
    } else if (company) {
      const existing = await prisma.company.findFirst({ where: { orgId: org.id, name: company } })
      const created = existing || (await prisma.company.create({ data: { name: company, orgId: org.id } }))
      companyId = created.id
    }

    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      (normalizedStatus && ["LEAD", "PROSPECT", "CUSTOMER"].includes(normalizedStatus) ? normalizedStatus : undefined) as any

    const previous = await prisma.contact.findUnique({ where: { id } })
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        tags,
        ownerId,
        notes,
        status: safeStatus,
        revenue: typeof revenue === "number" ? revenue : undefined,
        lastContact: lastContact ? new Date(lastContact) : undefined,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        ...(companyId !== undefined ? { companyId } : {}),
      },
      include: { company: true },
    })
    if (previous) {
      await createDecisionTrail({
        orgId: org.id,
        userId: user.id,
        action: "Updated contact",
        entity: "Contact",
        entityId: contact.id,
        before: contactSnapshot(previous),
        after: contactSnapshot(contact),
      })
    }
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated contact",
      entity: "Contact",
      entityId: contact.id,
      metadata: { name: contact.name, email: contact.email },
    })

    return NextResponse.json({ contact })
  } catch (error) {
    console.error("CRM contact update failed", error)
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 })
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
    const deleted = await prisma.contact.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted contact",
      entity: "Contact",
      entityId: deleted.id,
      metadata: { name: deleted.name, email: deleted.email },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CRM contact delete failed", error)
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}
