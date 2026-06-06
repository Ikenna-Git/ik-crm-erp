import { prisma } from "@/lib/prisma"

export type ApprovalSourceType = "invoice" | "expense"
export type ApprovalDecision = "pending" | "approved" | "rejected"

const APPROVAL_ACTIONS = {
  requested: "approval.requested",
  approved: "approval.approved",
  rejected: "approval.rejected",
} as const

type ApprovalMetadata = {
  approvalStatus: ApprovalDecision
  sourceType: ApprovalSourceType
  sourceId: string
  request: string
  owner: string
  amount: number
  sourceStatus?: string | null
}

export type ApprovalItem = {
  id: string
  sourceType: ApprovalSourceType
  sourceId: string
  request: string
  owner: string
  amount: number
  status: ApprovalDecision
  sourceStatus?: string | null
  createdAt: string
  updatedAt: string
}

const isApprovalAction = (value?: string | null) =>
  value === APPROVAL_ACTIONS.requested || value === APPROVAL_ACTIONS.approved || value === APPROVAL_ACTIONS.rejected

const getDecisionFromAction = (value?: string | null): ApprovalDecision | null => {
  if (value === APPROVAL_ACTIONS.requested) return "pending"
  if (value === APPROVAL_ACTIONS.approved) return "approved"
  if (value === APPROVAL_ACTIONS.rejected) return "rejected"
  return null
}

const readApprovalMetadata = (value: unknown): ApprovalMetadata | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const metadata = value as Record<string, unknown>
  const sourceType = metadata.sourceType
  const sourceId = metadata.sourceId
  const request = metadata.request
  const owner = metadata.owner
  const amount = metadata.amount
  const approvalStatus = metadata.approvalStatus
  if (
    (sourceType !== "invoice" && sourceType !== "expense") ||
    typeof sourceId !== "string" ||
    typeof request !== "string" ||
    typeof owner !== "string" ||
    typeof amount !== "number" ||
    (approvalStatus !== "pending" && approvalStatus !== "approved" && approvalStatus !== "rejected")
  ) {
    return null
  }

  return {
    sourceType,
    sourceId,
    request,
    owner,
    amount,
    approvalStatus,
    sourceStatus: typeof metadata.sourceStatus === "string" ? metadata.sourceStatus : null,
  }
}

export const buildApprovalMetadata = ({
  sourceType,
  sourceId,
  request,
  owner,
  amount,
  approvalStatus,
  sourceStatus,
}: {
  sourceType: ApprovalSourceType
  sourceId: string
  request: string
  owner: string
  amount: number
  approvalStatus: ApprovalDecision
  sourceStatus?: string | null
}) => ({
  sourceType,
  sourceId,
  request,
  owner,
  amount,
  approvalStatus,
  sourceStatus: sourceStatus || null,
})

export const listApprovalItemsForOrg = async (orgId: string): Promise<ApprovalItem[]> => {
  const logs = await prisma.auditLog.findMany({
    where: {
      orgId,
      action: { in: Object.values(APPROVAL_ACTIONS) },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      action: true,
      entityId: true,
      metadata: true,
      createdAt: true,
    },
  })

  const latestBySource = new Map<string, ApprovalItem>()

  for (const log of logs) {
    if (!isApprovalAction(log.action)) continue
    const metadata = readApprovalMetadata(log.metadata)
    if (!metadata) continue
    const key = `${metadata.sourceType}:${metadata.sourceId}`
    if (latestBySource.has(key)) continue
    latestBySource.set(key, {
      id: log.id,
      sourceType: metadata.sourceType,
      sourceId: metadata.sourceId,
      request: metadata.request,
      owner: metadata.owner,
      amount: metadata.amount,
      status: metadata.approvalStatus || getDecisionFromAction(log.action) || "pending",
      sourceStatus: metadata.sourceStatus,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.createdAt.toISOString(),
    })
  }

  return [...latestBySource.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export const getApprovalStateMapForOrg = async (orgId: string) => {
  const approvals = await listApprovalItemsForOrg(orgId)
  return approvals.reduce<Record<string, ApprovalItem>>((acc, item) => {
    acc[`${item.sourceType}:${item.sourceId}`] = item
    return acc
  }, {})
}

export const approvalActions = APPROVAL_ACTIONS
