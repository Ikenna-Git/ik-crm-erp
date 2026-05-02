export const ORG_STATUSES = ["active", "suspended", "archived"] as const

export type OrgStatus = (typeof ORG_STATUSES)[number]

export const ORG_STATUS_LABELS: Record<OrgStatus, string> = {
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
}

export const normalizeOrgStatus = (value?: string | null): OrgStatus => {
  const normalized = String(value || "").trim().toLowerCase()
  return ORG_STATUSES.includes(normalized as OrgStatus) ? (normalized as OrgStatus) : "active"
}

export const getOrgStatusMessage = (status?: string | null, reason?: string | null) => {
  if (status === "suspended") {
    return reason ? `This workspace is suspended: ${reason}` : "This workspace is suspended. Contact the platform owner."
  }

  if (status === "archived") {
    return reason ? `This workspace is archived: ${reason}` : "This workspace is archived. Contact the platform owner."
  }

  return null
}
