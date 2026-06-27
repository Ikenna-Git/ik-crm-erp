import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess, handleAccessRouteError } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"
import { createDecisionTrail, invoiceSnapshot } from "@/lib/decision-trails"
import { getApprovalStateMapForOrg } from "@/lib/approval-requests"
import { hasModuleAccess } from "@/lib/access-control"
import { isPrivacyUnlockedForOrg } from "@/lib/privacy-lock"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "view")
    const [invoices, approvalStates] = await Promise.all([
      prisma.invoice.findMany({
        where: { orgId: org.id },
        orderBy: { updatedAt: "desc" },
      }),
      getApprovalStateMapForOrg(org.id),
    ])
    const canManageAccounting = hasModuleAccess(user, "accounting", "manage")
    const revealSensitive =
      canManageAccounting && (await isPrivacyUnlockedForOrg({ request, orgId: org.id, module: "accounting" }))
    return NextResponse.json({
      invoices: invoices.map((invoice) => ({
        ...(revealSensitive
          ? invoice
          : {
              ...invoice,
              clientName: "Protected client",
              amount: 0,
            }),
        approvalStatus: approvalStates[`invoice:${invoice.id}`]?.status || null,
      })),
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load invoices")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const body = await request.json()
    const { invoiceNumber, clientName, amount, status, dueDate, issueDate, notes, terms, lineItems, customFields, relatedLinks, relatedRecords } = body || {}
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
        notes: typeof notes === "string" ? notes.trim() : null,
        terms: typeof terms === "string" ? terms.trim() : null,
        lineItems: Array.isArray(lineItems) ? lineItems : undefined,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        relatedLinks: Array.isArray(relatedLinks) ? relatedLinks : undefined,
        relatedRecords: relatedRecords && typeof relatedRecords === "object" ? relatedRecords : undefined,
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

    const approvalStates = await getApprovalStateMapForOrg(org.id)
    return NextResponse.json({
      invoice: {
        ...invoice,
        approvalStatus: approvalStates[`invoice:${invoice.id}`]?.status || null,
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to create invoice")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const body = await request.json()
    const { id, invoiceNumber, clientName, amount, status, dueDate, issueDate, notes, terms, lineItems, customFields, relatedLinks, relatedRecords } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      (normalizedStatus && ["DRAFT", "SENT", "PAID", "OVERDUE"].includes(normalizedStatus) ? normalizedStatus : undefined) as any
    const previous = await prisma.invoice.findFirst({ where: { id, orgId: org.id } })
    if (!previous) {
      return NextResponse.json({ error: "Invoice not found in this workspace" }, { status: 404 })
    }
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber,
        clientName,
        amount: typeof amount === "number" ? amount : undefined,
        status: safeStatus,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        notes: typeof notes === "string" ? notes.trim() : undefined,
        terms: typeof terms === "string" ? terms.trim() : undefined,
        lineItems: lineItems !== undefined && Array.isArray(lineItems) ? lineItems : undefined,
        customFields: customFields !== undefined && typeof customFields === "object" ? customFields : undefined,
        relatedLinks: relatedLinks !== undefined && Array.isArray(relatedLinks) ? relatedLinks : undefined,
        relatedRecords: relatedRecords !== undefined && typeof relatedRecords === "object" ? relatedRecords : undefined,
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

    const approvalStates = await getApprovalStateMapForOrg(org.id)
    return NextResponse.json({
      invoice: {
        ...invoice,
        approvalStatus: approvalStates[`invoice:${invoice.id}`]?.status || null,
      },
    })
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
    const existing = await prisma.invoice.findFirst({ where: { id, orgId: org.id } })
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found in this workspace" }, { status: 404 })
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
