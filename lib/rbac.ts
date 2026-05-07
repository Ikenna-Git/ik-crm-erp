import { type AccessLevel, type AccessModule, hasModuleAccess } from "@/lib/access-control"
import { canManageWorkspaceSettings, isAdmin, isSuperAdmin } from "@/lib/authz"
import { logSecurityEvent } from "@/lib/observability"
import { RequestUserError } from "@/lib/request-user"

type PlatformRole = "USER" | "ADMIN" | "ORG_OWNER" | "SUPER_ADMIN"

export const RBAC_ACTIONS = [
  "crm.view",
  "crm.manage",
  "accounting.view",
  "accounting.manage",
  "reports.export",
  "reports.export.email",
  "tasks.manage",
  "ops.workflows.manage",
  "playbooks.manage",
  "settings.workspace.manage",
  "admin.users.invite",
  "admin.users.roleChange",
  "admin.users.delete",
  "admin.workspace.manage",
  "admin.orgs.manage",
  "billing.view",
  "billing.manage",
  "billing.providerRefs.manage",
  "webhooks.manage",
  "audit.read",
  "audit.write",
  "rollback.execute",
  "portal.manage",
  "ai.use",
  "uploads.manage",
] as const

export type RbacAction = (typeof RBAC_ACTIONS)[number]

type RbacSubject = {
  id?: string | null
  email?: string | null
  role?: string | null
  accessProfile?: string | null
  moduleAccess?: unknown
}

type ActionRule = {
  roles?: PlatformRole[]
  requireWorkspaceOwner?: boolean
  requireSuperAdmin?: boolean
  module?: AccessModule
  level?: AccessLevel
  anyModule?: Array<{ module: AccessModule; level?: AccessLevel }>
}

const RULES: Record<RbacAction, ActionRule> = {
  "crm.view": { module: "crm", level: "view" },
  "crm.manage": { module: "crm", level: "manage" },
  "accounting.view": { module: "accounting", level: "view" },
  "accounting.manage": { module: "accounting", level: "manage" },
  "reports.export": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "reports.export.email": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "tasks.manage": { module: "projects", level: "manage" },
  "ops.workflows.manage": { module: "operations", level: "manage" },
  "playbooks.manage": { module: "playbooks", level: "manage" },
  "settings.workspace.manage": { requireWorkspaceOwner: true },
  "admin.users.invite": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "admin.users.roleChange": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "admin.users.delete": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "admin.workspace.manage": { requireWorkspaceOwner: true },
  "admin.orgs.manage": { requireSuperAdmin: true },
  "billing.view": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "billing.manage": { requireWorkspaceOwner: true },
  "billing.providerRefs.manage": { requireSuperAdmin: true },
  "webhooks.manage": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "audit.read": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "audit.write": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "rollback.execute": { roles: ["ADMIN", "ORG_OWNER", "SUPER_ADMIN"] },
  "portal.manage": { module: "portal", level: "manage" },
  "ai.use": { module: "ai", level: "view" },
  "uploads.manage": {
    anyModule: [
      { module: "docs", level: "manage" },
      { module: "gallery", level: "manage" },
      { module: "portal", level: "manage" },
    ],
  },
}

const hasAnyModuleRequirement = (
  subject: RbacSubject,
  requirements: Array<{ module: AccessModule; level?: AccessLevel }>,
) => requirements.some((entry) => hasModuleAccess(subject, entry.module, entry.level || "view"))

export const canPerformAction = (subject: RbacSubject, action: RbacAction) => {
  const rule = RULES[action]
  if (!rule) return false

  if (rule.requireSuperAdmin) {
    return isSuperAdmin(subject.role)
  }

  if (rule.requireWorkspaceOwner) {
    return canManageWorkspaceSettings(subject.role)
  }

  if (rule.roles?.length) {
    const role = subject.role as PlatformRole | undefined
    if (!role || !rule.roles.includes(role)) {
      return false
    }
  }

  if (rule.module && !hasModuleAccess(subject, rule.module, rule.level || "view")) {
    return false
  }

  if (rule.anyModule && !hasAnyModuleRequirement(subject, rule.anyModule)) {
    return false
  }

  if (!rule.roles && !rule.requireWorkspaceOwner && !rule.requireSuperAdmin && !rule.module && !rule.anyModule) {
    return isAdmin(subject.role)
  }

  return true
}

export const assertActionAccess = async ({
  request,
  subject,
  orgId,
  action,
}: {
  request: Request
  subject: RbacSubject
  orgId?: string | null
  action: RbacAction
}) => {
  if (canPerformAction(subject, action)) {
    return
  }

  void logSecurityEvent({
    level: "warning",
    action: "rbac.denied",
    message: `RBAC denied ${action}.`,
    request,
    actor: {
      id: subject.id || null,
      email: subject.email || null,
      role: subject.role || null,
    },
    orgId,
    metadata: { action },
  })

  throw new RequestUserError(`Not authorized for ${action}`, 403)
}

export const getRbacMatrix = () => RULES
