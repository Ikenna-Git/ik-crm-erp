import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const companies = await prisma.company.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ companies })
  } catch (error) {
    console.error("CRM companies fetch failed", error)
    return NextResponse.json({ error: "Failed to load companies" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { name, industry, size, ownerId } = body || {}
    if (!name) {
      return NextResponse.json({ error: "Name required" }, { status: 400 })
    }
    const company = await prisma.company.create({
      data: { name, industry, size, ownerId, orgId: org.id },
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
    console.error("CRM company create failed", error)
    return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, name, industry, size, ownerId } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const company = await prisma.company.update({
      where: { id },
      data: { name, industry, size, ownerId },
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
    console.error("CRM company update failed", error)
    return NextResponse.json({ error: "Failed to update company" }, { status: 500 })
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
    console.error("CRM company delete failed", error)
    return NextResponse.json({ error: "Failed to delete company" }, { status: 500 })
  }
}
