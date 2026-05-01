import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess, handleAccessRouteError } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "crm", "view")
    const companies = await prisma.company.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ companies })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load companies")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "crm", "manage")
    const body = await request.json()
    const { name, industry, size, ownerId, customFields } = body || {}
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }
    const company = await prisma.company.create({
      data: {
        name,
        industry,
        size,
        ownerId,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        orgId: org.id,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created company",
      entity: "Company",
      entityId: company.id,
      metadata: { name: company.name },
    })

    return NextResponse.json({ company })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create company")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "crm", "manage")
    const body = await request.json()
    const { id, name, industry, size, ownerId, customFields } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        industry,
        size,
        ownerId,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated company",
      entity: "Company",
      entityId: company.id,
      metadata: { name: company.name },
    })

    return NextResponse.json({ company })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update company")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "crm", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const deleted = await prisma.company.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted company",
      entity: "Company",
      entityId: deleted.id,
      metadata: { name: deleted.name },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete company")
  }
}
