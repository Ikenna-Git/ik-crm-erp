import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getApprovalStateMapForOrg, listApprovalItemsForOrg, approvalActions, buildApprovalMetadata, type ApprovalDecision, type ApprovalSourceType } from "@/lib/approval-requests"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable approvals." }, { status: 503 })

const normalizeSourceType = (value: unknown): ApprovalSourceType | null =>
  value === "invoice" || value === "expense" ? value : null

const normalizeDecision = (value: unknown): ApprovalDecision | null =>
  value === "pending" || value === "approved" || value === "rejected" ? value : null

const loadSourceRecord = async (orgId: string, sourceType: ApprovalSourceType, sourceId: string) => {
  if (sourceType === "invoice") {
    const invoice = await prisma.invoice.findFirst({
      where: { id: sourceId, orgId },
      select: { id: true, invoiceNumber: true, clientName: true, amount: true, status: true },
    })
    if (!invoice) return null
    return {
      request: `Invoice ${invoice.invoiceNumber}`,
      owner: invoice.clientName,
      amount: invoice.amount,
      sourceStatus: invoice.status,
    }
  }

  const expense = await prisma.expense.findFirst({
    where: { id: sourceId, orgId },
    select: { id: true, description: true, submittedBy: true, amount: true, status: true },
  })
  if (!expense) return null
  return {
    request: `Expense: ${expense.description}`,
    owner: expense.submittedBy || "Finance",
    amount: expense.amount,
    sourceStatus: expense.status,
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "operations", "view")
    const approvals = await listApprovalItemsForOrg(org.id)
    return NextResponse.json({ approvals })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load approvals")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "accounting", "manage")
    const body = await request.json()
    const sourceType = normalizeSourceType(body?.sourceType)
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : ""

    if (!sourceType || !sourceId) {
      return NextResponse.json({ error: "sourceType and sourceId are required" }, { status: 400 })
    }

    const source = await loadSourceRecord(org.id, sourceType, sourceId)
    if (!source) {
      return NextResponse.json({ error: "Approval source record not found in this workspace" }, { status: 404 })
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: approvalActions.requested,
      entity: sourceType === "invoice" ? "Invoice" : "Expense",
      entityId: sourceId,
      metadata: buildApprovalMetadata({
        sourceType,
        sourceId,
        request: source.request,
        owner: source.owner,
        amount: source.amount,
        approvalStatus: "pending",
        sourceStatus: source.sourceStatus,
      }),
    })

    const approvalStateMap = await getApprovalStateMapForOrg(org.id)
    return NextResponse.json({ approval: approvalStateMap[`${sourceType}:${sourceId}`] || null })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to request approval")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "operations", "manage")
    const body = await request.json()
    const sourceType = normalizeSourceType(body?.sourceType)
    const sourceId = typeof body?.sourceId === "string" ? body.sourceId : ""
    const decision = normalizeDecision(body?.decision)

    if (!sourceType || !sourceId || (decision !== "approved" && decision !== "rejected")) {
      return NextResponse.json({ error: "sourceType, sourceId, and decision are required" }, { status: 400 })
    }

    const source = await loadSourceRecord(org.id, sourceType, sourceId)
    if (!source) {
      return NextResponse.json({ error: "Approval source record not found in this workspace" }, { status: 404 })
    }

    let invoice = null
    let expense = null

    if (sourceType === "expense") {
      expense = await prisma.expense.update({
        where: { id: sourceId },
        data: { status: decision === "approved" ? "APPROVED" : "REJECTED" },
      })
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: decision === "approved" ? approvalActions.approved : approvalActions.rejected,
      entity: sourceType === "invoice" ? "Invoice" : "Expense",
      entityId: sourceId,
      metadata: buildApprovalMetadata({
        sourceType,
        sourceId,
        request: source.request,
        owner: source.owner,
        amount: source.amount,
        approvalStatus: decision,
        sourceStatus: sourceType === "expense" ? expense?.status || source.sourceStatus : source.sourceStatus,
      }),
    })

    const approvalStateMap = await getApprovalStateMapForOrg(org.id)

    if (sourceType === "invoice") {
      invoice = await prisma.invoice.findFirst({
        where: { id: sourceId, orgId: org.id },
      })
    }

    return NextResponse.json({
      approval: approvalStateMap[`${sourceType}:${sourceId}`] || null,
      invoice,
      expense,
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update approval")
  }
}
