import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess, handleAccessRouteError } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"
import { createDecisionTrail, invoiceSnapshot } from "@/lib/decision-trails"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "accounting", "view")
    const invoices = await prisma.invoice.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ invoices })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load invoices")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const body = await request.json()
    const { invoiceNumber, clientName, amount, status, dueDate, issueDate } = body || {}
    if (!invoiceNumber || !clientName || typeof amount !== "number") {
      return NextResponse.json({ error: "invoiceNumber, clientName, amount required" }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "DRAFT"
    const safeStatus = (["DRAFT", "SENT", "PAID", "OVERDUE"].includes(normalizedStatus) ? normalizedStatus : "DRAFT") as any
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        amount,
        status: safeStatus,
        issueDate: issueDate ? new Date(issueDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        orgId: org.id,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created invoice",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { number: invoice.invoiceNumber, amount: invoice.amount, status: invoice.status },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create invoice")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const body = await request.json()
    const { id, invoiceNumber, clientName, amount, status, dueDate, issueDate } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      (normalizedStatus && ["DRAFT", "SENT", "PAID", "OVERDUE"].includes(normalizedStatus) ? normalizedStatus : undefined) as any
    const previous = await prisma.invoice.findUnique({ where: { id } })
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        clientName,
        amount: typeof amount === "number" ? amount : undefined,
        status: safeStatus,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    })
    if (previous) {
      await createDecisionTrail({
        orgId: org.id,
        userId: user.id,
        action: "Updated invoice",
        entity: "Invoice",
        entityId: invoice.id,
        before: invoiceSnapshot(previous),
        after: invoiceSnapshot(invoice),
      })
    }
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated invoice",
      entity: "Invoice",
      entityId: invoice.id,
      metadata: { number: invoice.invoiceNumber, amount: invoice.amount, status: invoice.status },
    })

    return NextResponse.json({ invoice })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update invoice")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const deleted = await prisma.invoice.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted invoice",
      entity: "Invoice",
      entityId: deleted.id,
      metadata: { number: deleted.invoiceNumber, amount: deleted.amount, status: deleted.status },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete invoice")
  }
}
