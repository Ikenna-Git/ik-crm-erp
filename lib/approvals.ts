export type ApprovalRequest = {
  id: string
  request: string
  owner: string
  amount?: string
  status: "pending" | "approved" | "rejected"
  module: string
  createdAt: string
}

const STORAGE_KEY = "civis_ops_approvals"

const readApprovals = (): ApprovalRequest[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeApprovals = (approvals: ApprovalRequest[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(approvals))
  } catch {
    // ignore storage errors
  }
}

export const getApprovals = (fallback: ApprovalRequest[] = []) => {
  const stored = readApprovals()
  if (stored.length) return stored
  if (fallback.length) writeApprovals(fallback)
  return fallback
}

export const addApprovalRequest = (payload: Omit<ApprovalRequest, "id" | "status" | "createdAt">) => {
  if (typeof window === "undefined") return null
  const existing = readApprovals()
  const entry: ApprovalRequest = {
    id: `ap-${Date.now()}`,
    status: "pending",
    createdAt: new Date().toISOString(),
    ...payload,
  }
  const next = [entry, ...existing]
  writeApprovals(next)
  return entry
}

export const updateApprovalStatus = (id: string, status: ApprovalRequest["status"]) => {
  if (typeof window === "undefined") return []
  const existing = readApprovals()
  const next = existing.map((item) => (item.id === id ? { ...item, status } : item))
  writeApprovals(next)
  return next
}

export const approvalsStorageKey = STORAGE_KEY
