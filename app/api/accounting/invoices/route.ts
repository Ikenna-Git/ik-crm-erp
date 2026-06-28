import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireModuleAccess, handleAccessRouteError } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"
import { createDecisionTrail, invoiceSnapshot } from "@/lib/decision-trails"
import { getApprovalStateMapForOrg } from "@/lib/approval-requests"
import { hasModuleAccess } from "@/lib/access-control"
import { isPrivacyUnlockedForOrg } from "@/lib/privacy-lock"
import {
  buildDocumentIdentityFromOrg,
  parseInvoiceDocumentIdentitySnapshot,
  shouldFreezeInvoiceDocumentIdentity,
} from "@/lib/document-identity"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

type InvoiceLineItemInput = {
  description?: unknown
  quantity?: unknown
  unitPrice?: unknown
  amount?: unknown
}

type InvoiceLinkInput = {
  label?: unknown
  url?: unknown
}

type NormalizedInvoiceLineItem = {
  description?: string
  quantity: number
  unitPrice: number
  amount: number
}

type NormalizedInvoiceLink = {
  label?: string
  url: string
}

type InvoiceLineItemError = { error: string }
type InvoiceLinkError = { error: string }

const isInvoiceLineItemError = (value: NormalizedInvoiceLineItem | InvoiceLineItemError | null): value is InvoiceLineItemError =>
  Boolean(value && "error" in value)

const isInvoiceLinkError = (value: NormalizedInvoiceLink | InvoiceLinkError | null): value is InvoiceLinkError =>
  Boolean(value && "error" in value)

const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const toFiniteNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeInvoiceLineItems = (value: unknown) => {
  if (value === undefined) return { ok: true as const, lineItems: undefined }
  if (!Array.isArray(value)) {
    return { ok: false as const, error: "Invoice line items must be an array." }
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const typed = item as InvoiceLineItemInput
      const description = typeof typed.description === "string" ? typed.description.trim() : ""
      const quantity = toFiniteNumber(typed.quantity)
      const unitPrice = toFiniteNumber(typed.unitPrice)
      if (!description && !quantity && !unitPrice) return null
      if (quantity === null || unitPrice === null) {
        return { error: "Invoice line items must use valid numeric quantity and unit price." }
      }
      if (quantity < 0 || unitPrice < 0) {
        return { error: "Invoice line items cannot use negative quantity or unit price." }
      }
      return {
        description: description || undefined,
        quantity,
        unitPrice,
        amount: quantity * unitPrice,
      }
    })
    .filter(Boolean)

  const invalid = normalized.find(isInvoiceLineItemError)
  if (invalid) {
    return { ok: false as const, error: invalid.error }
  }

  return { ok: true as const, lineItems: normalized.filter((item): item is NormalizedInvoiceLineItem => Boolean(item && !("error" in item))) }
}

const normalizeInvoiceRelatedLinks = (value: unknown) => {
  if (value === undefined) return { ok: true as const, relatedLinks: undefined }
  if (!Array.isArray(value)) {
    return { ok: false as const, error: "Related invoice links must be an array." }
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const typed = item as InvoiceLinkInput
      const label = typeof typed.label === "string" ? typed.label.trim() : ""
      const url = typeof typed.url === "string" ? typed.url.trim() : ""
      if (!label && !url) return null
      if (!url) return { error: "Related invoice links must include a URL." }
      if (!isSafeHttpUrl(url)) return { error: "Related invoice links must use a valid http or https URL." }
      return { label: label || undefined, url }
    })
    .filter(Boolean)

  const invalid = normalized.find(isInvoiceLinkError)
  if (invalid) {
    return { ok: false as const, error: invalid.error }
  }

  return { ok: true as const, relatedLinks: normalized.filter((item): item is NormalizedInvoiceLink => Boolean(item && !("error" in item))) }
}

const parseDateInput = (value: unknown, label: string) => {
  if (value === undefined) return { ok: true as const, date: undefined }
  if (value === null || value === "") return { ok: true as const, date: null }
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const, error: `${label} must be a valid date.` }
  }
  return { ok: true as const, date: parsed }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "view")
    const currentDocumentIdentity = buildDocumentIdentityFromOrg(org)
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
        documentIdentity:
          parseInvoiceDocumentIdentitySnapshot(invoice) ||
          (shouldFreezeInvoiceDocumentIdentity(invoice.status) ? currentDocumentIdentity : currentDocumentIdentity),
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
    const normalizedInvoiceNumber = typeof invoiceNumber === "string" ? invoiceNumber.trim() : ""
    const normalizedClientName = typeof clientName === "string" ? clientName.trim() : ""
    const normalizedAmount = toFiniteNumber(amount)
    if (!normalizedInvoiceNumber || !normalizedClientName || normalizedAmount === null) {
      return NextResponse.json({ error: "Invoice number, client name, and amount are required." }, { status: 400 })
    }
    if (normalizedAmount < 0) {
      return NextResponse.json({ error: "Invoice amount cannot be negative." }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "DRAFT"
    const safeStatus = (["DRAFT", "SENT", "PAID", "OVERDUE"].includes(normalizedStatus) ? normalizedStatus : "DRAFT") as any
    const normalizedLineItems = normalizeInvoiceLineItems(lineItems)
    if (!normalizedLineItems.ok) {
      return NextResponse.json({ error: normalizedLineItems.error }, { status: 400 })
    }
    const normalizedRelatedLinks = normalizeInvoiceRelatedLinks(relatedLinks)
    if (!normalizedRelatedLinks.ok) {
      return NextResponse.json({ error: normalizedRelatedLinks.error }, { status: 400 })
    }
    const parsedIssueDate = parseDateInput(issueDate, "Issue date")
    if (!parsedIssueDate.ok) {
      return NextResponse.json({ error: parsedIssueDate.error }, { status: 400 })
    }
    const parsedDueDate = parseDateInput(dueDate, "Due date")
    if (!parsedDueDate.ok) {
      return NextResponse.json({ error: parsedDueDate.error }, { status: 400 })
    }
    if (shouldFreezeInvoiceDocumentIdentity(safeStatus) && !org.legalBusinessName?.trim()) {
      return NextResponse.json(
        { error: "Set the legal business name in Company Identity before issuing a non-draft invoice." },
        { status: 400 },
      )
    }
    const documentIdentitySnapshot = shouldFreezeInvoiceDocumentIdentity(safeStatus)
      ? buildDocumentIdentityFromOrg(org)
      : undefined
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: normalizedInvoiceNumber,
        clientName: normalizedClientName,
        ...(normalizedAmount !== undefined ? { amount: normalizedAmount } : {}),
        status: safeStatus,
        issueDate: parsedIssueDate.date ?? null,
        dueDate: parsedDueDate.date ?? null,
        notes: typeof notes === "string" ? notes.trim() : org.defaultInvoiceNotes || null,
        terms: typeof terms === "string" ? terms.trim() : org.defaultInvoiceTerms || null,
        lineItems: normalizedLineItems.lineItems,
        customFields: customFields && typeof customFields === "object" ? customFields : undefined,
        relatedLinks: normalizedRelatedLinks.relatedLinks,
        relatedRecords: relatedRecords && typeof relatedRecords === "object" ? relatedRecords : undefined,
        documentIdentitySnapshot,
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
        documentIdentity: parseInvoiceDocumentIdentitySnapshot(invoice) || buildDocumentIdentityFromOrg(org),
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
      return NextResponse.json({ error: "Invoice id is required." }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      (normalizedStatus && ["DRAFT", "SENT", "PAID", "OVERDUE"].includes(normalizedStatus) ? normalizedStatus : undefined) as any
    const previous = await prisma.invoice.findFirst({ where: { id, orgId: org.id } })
    if (!previous) {
      return NextResponse.json({ error: "Invoice not found in this workspace" }, { status: 404 })
    }
    const nextStatus = safeStatus || previous.status
    const normalizedAmount = amount !== undefined ? toFiniteNumber(amount) : undefined
    if (amount !== undefined && normalizedAmount === null) {
      return NextResponse.json({ error: "Invoice amount must be a valid number." }, { status: 400 })
    }
    if (typeof normalizedAmount === "number" && normalizedAmount < 0) {
      return NextResponse.json({ error: "Invoice amount cannot be negative." }, { status: 400 })
    }
    const normalizedLineItems = normalizeInvoiceLineItems(lineItems)
    if (!normalizedLineItems.ok) {
      return NextResponse.json({ error: normalizedLineItems.error }, { status: 400 })
    }
    const normalizedRelatedLinks = normalizeInvoiceRelatedLinks(relatedLinks)
    if (!normalizedRelatedLinks.ok) {
      return NextResponse.json({ error: normalizedRelatedLinks.error }, { status: 400 })
    }
    const parsedIssueDate = parseDateInput(issueDate, "Issue date")
    if (!parsedIssueDate.ok) {
      return NextResponse.json({ error: parsedIssueDate.error }, { status: 400 })
    }
    const parsedDueDate = parseDateInput(dueDate, "Due date")
    if (!parsedDueDate.ok) {
      return NextResponse.json({ error: parsedDueDate.error }, { status: 400 })
    }
    if (shouldFreezeInvoiceDocumentIdentity(nextStatus) && !org.legalBusinessName?.trim()) {
      return NextResponse.json(
        { error: "Set the legal business name in Company Identity before issuing a non-draft invoice." },
        { status: 400 },
      )
    }
    const freezeIdentityNow =
      shouldFreezeInvoiceDocumentIdentity(nextStatus) && !parseInvoiceDocumentIdentitySnapshot(previous)
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        invoiceNumber: typeof invoiceNumber === "string" ? invoiceNumber.trim() : undefined,
        clientName: typeof clientName === "string" ? clientName.trim() : undefined,
        amount: normalizedAmount,
        status: safeStatus,
        issueDate: parsedIssueDate.date,
        dueDate: parsedDueDate.date,
        notes: typeof notes === "string" ? notes.trim() : undefined,
        terms: typeof terms === "string" ? terms.trim() : undefined,
        lineItems: normalizedLineItems.lineItems,
        customFields: customFields !== undefined && typeof customFields === "object" ? customFields : undefined,
        relatedLinks: normalizedRelatedLinks.relatedLinks,
        relatedRecords: relatedRecords !== undefined && typeof relatedRecords === "object" ? relatedRecords : undefined,
        documentIdentitySnapshot: freezeIdentityNow ? buildDocumentIdentityFromOrg(org) : undefined,
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
        documentIdentity: parseInvoiceDocumentIdentitySnapshot(invoice) || buildDocumentIdentityFromOrg(org),
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
