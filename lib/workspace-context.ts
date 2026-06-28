import { ACCESS_PROFILE_LABELS, normalizeAccessProfile } from "@/lib/access-control"
import { canManageWorkspaceIdentity, canViewFounderControls } from "@/lib/authz"

export const workspaceContextUpdatedEventName = "civis:workspace-context-updated"

export type WorkspaceContextResponse = {
  org: {
    id: string
    name: string
    logoUrl?: string | null
    industry?: string | null
    operatingTemplate?: string | null
    operatingTemplateLabel?: string | null
    theme?: string | null
    status?: string | null
    notifyEmail?: string | null
    legalBusinessName?: string | null
    tradingName?: string | null
    businessEmail?: string | null
    businessPhone?: string | null
    businessAddress?: string | null
    taxNumber?: string | null
    companyRegistrationNumber?: string | null
    defaultInvoiceTerms?: string | null
    defaultInvoiceNotes?: string | null
    paymentInstructions?: string | null
  }
  viewer: {
    id: string
    role?: string | null
    accessProfile?: string | null
    title?: string | null
    roleLabel: string
    canManageIdentity: boolean
    canViewFounderControls: boolean
  }
  launch: {
    mode: WorkspaceMode
    modeLabel: string
    summary: string
    blockerCount: number
    reviewCount: number
    blockers: Array<{
      id: string
      label: string
      status: string
    }>
  }
  setupItems: Array<{
    id: string
    label: string
    status: string
    reason: string
    nextAction: string
    href?: string
  }>
}

export const WORKSPACE_INDUSTRIES = [
  "Technology",
  "Finance",
  "Retail",
  "Manufacturing",
  "Healthcare",
  "Logistics",
  "Professional Services",
  "Real Estate",
  "Education",
  "Energy",
] as const

export const OPERATING_TEMPLATES = [
  {
    value: "SALES_CRM",
    label: "Sales CRM",
    description: "Pipeline-first selling with CRM handoff into invoicing and customer delivery.",
    suggestedFields: ["Lead source", "Lifecycle stage", "Deal type", "Expected close"],
  },
  {
    value: "ENGINEERING_PROJECTS",
    label: "Engineering / Technical Projects",
    description: "Project delivery with links to repositories, deployments, proof, and operating approvals.",
    suggestedFields: ["Repository URL", "Deployment URL", "Owner", "Implementation start"],
  },
  {
    value: "FIELD_OPERATIONS",
    label: "Field Operations / Logistics",
    description: "Site work, delivery execution, client proof, and ops follow-through across teams.",
    suggestedFields: ["Site", "Location", "Proof note", "Escalation owner"],
  },
  {
    value: "HR_PEOPLE_OPS",
    label: "HR / People Ops",
    description: "People operations, privacy-aware records, attendance, and admin workflows.",
    suggestedFields: ["Department", "Return date", "Confidential owner", "Policy bucket"],
  },
  {
    value: "INVENTORY_PROCUREMENT",
    label: "Inventory / Procurement",
    description: "Stock, purchasing, and supplier coordination with finance and operations context.",
    suggestedFields: ["Supplier tier", "Restock threshold", "Approval path", "Warehouse"],
  },
  {
    value: "SERVICE_MAINTENANCE",
    label: "Service / Maintenance",
    description: "Recurring support, client proof, site visits, and invoice follow-up from one operating record.",
    suggestedFields: ["Service window", "Asset ID", "Technician", "SLA tier"],
  },
] as const

export type WorkspaceMode = "setup" | "launch-review" | "live" | "restricted"

export const getWorkspaceInitials = (value?: string | null) => {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!words.length) return "CW"
  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

export const getWorkspaceTemplateLabel = (value?: string | null) =>
  OPERATING_TEMPLATES.find((item) => item.value === value)?.label || null

export const getWorkspaceRoleLabel = ({
  role,
  accessProfile,
  title,
  email,
}: {
  role?: string | null
  accessProfile?: string | null
  title?: string | null
  email?: string | null
}) => {
  if (title?.trim()) return title.trim()
  if (role === "SUPER_ADMIN" && canViewFounderControls(role, email)) return "Owner"
  if (role === "ORG_OWNER") return "Owner"
  if (role === "ADMIN") return "Admin"
  const normalizedProfile = normalizeAccessProfile(accessProfile)
  return ACCESS_PROFILE_LABELS[normalizedProfile]
}

export const getWorkspaceModeMeta = (
  mode: WorkspaceMode,
  blockerCount: number,
  recommendedCount: number,
) => {
  if (mode === "restricted") {
    return {
      label: "Restricted",
      summary: "Workspace access is limited by current status or governance rules.",
    }
  }

  if (mode === "setup") {
    return {
      label: "Setup mode",
      summary: blockerCount > 0 ? `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} before launch` : "Core setup still in progress",
    }
  }

  if (mode === "launch-review") {
    return {
      label: "Launch review",
      summary:
        blockerCount > 0
          ? `${blockerCount} blocker${blockerCount === 1 ? "" : "s"} before launch`
          : recommendedCount > 0
            ? `${recommendedCount} review item${recommendedCount === 1 ? "" : "s"} pending`
            : "Action required",
    }
  }

  return {
    label: "Live",
    summary: "Operating centre active",
  }
}

export const deriveWorkspaceMode = ({
  orgStatus,
  blockerCount,
  recommendedCount,
  hasCoreSetupGap,
}: {
  orgStatus?: string | null
  blockerCount: number
  recommendedCount: number
  hasCoreSetupGap: boolean
}): WorkspaceMode => {
  if (orgStatus && orgStatus !== "active") return "restricted"
  if (blockerCount > 0 && hasCoreSetupGap) return "setup"
  if (blockerCount > 0 || recommendedCount > 0) return "launch-review"
  return "live"
}

export const getWorkspaceIdentityPermissions = ({
  role,
  email,
}: {
  role?: string | null
  email?: string | null
}) => ({
  canManageIdentity: canManageWorkspaceIdentity(role, email),
  canViewFounderControls: canViewFounderControls(role, email),
})

export const emitWorkspaceContextUpdated = (detail: WorkspaceContextResponse) => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(workspaceContextUpdatedEventName, { detail }))
}

export type WorkspaceDocumentIdentity = {
  legalBusinessName: string | null
  tradingName: string | null
  businessEmail: string | null
  businessPhone: string | null
  businessAddress: string | null
  taxNumber: string | null
  companyRegistrationNumber: string | null
  defaultInvoiceTerms: string | null
  defaultInvoiceNotes: string | null
  paymentInstructions: string | null
  logoUrl: string | null
  workspaceDisplayName: string | null
}
