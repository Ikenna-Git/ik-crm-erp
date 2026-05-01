import type { Role } from "@prisma/client"

export const FOUNDER_SUPER_ADMIN_EMAIL = "ikchils@gmail.com"

export const getFounderSuperAdminEmail = () => FOUNDER_SUPER_ADMIN_EMAIL

export const isOrgOwner = (role?: string | null) => role === "ORG_OWNER"

export const isAdmin = (role?: string | null) => role === "ADMIN" || role === "ORG_OWNER" || role === "SUPER_ADMIN"

export const isSuperAdmin = (role?: string | null) => role === "SUPER_ADMIN"

export const canManageWorkspaceSettings = (role?: string | null) => role === "ORG_OWNER" || role === "SUPER_ADMIN"

export const isFounderSuperAdminEmail = (email?: string | null) =>
  Boolean(email && email.trim().toLowerCase() === getFounderSuperAdminEmail())

export const canAssignRole = ({
  actorRole,
  actorEmail,
  targetRole,
  targetEmail,
  nextRole,
}: {
  actorRole?: string | null
  actorEmail?: string | null
  targetRole?: string | null
  targetEmail?: string | null
  nextRole: Role
}) => {
  if (!isAdmin(actorRole)) return false

  if (isFounderSuperAdminEmail(targetEmail)) {
    return isFounderSuperAdminEmail(actorEmail) && nextRole === "SUPER_ADMIN"
  }

  if (targetRole === "SUPER_ADMIN") {
    return false
  }

  if (nextRole === "SUPER_ADMIN") {
    return false
  }

  if (isSuperAdmin(actorRole)) {
    return true
  }

  if (actorRole === "ORG_OWNER") {
    return nextRole === "USER" || nextRole === "ADMIN"
  }

  return nextRole === "USER"
}

export const canDeleteUser = ({
  actorRole,
  actorEmail,
  targetRole,
  targetEmail,
  targetUserId,
  actorUserId,
}: {
  actorRole?: string | null
  actorEmail?: string | null
  targetRole?: string | null
  targetEmail?: string | null
  targetUserId?: string | null
  actorUserId?: string | null
}) => {
  if (!isAdmin(actorRole)) return false
  if (targetUserId && actorUserId && targetUserId === actorUserId) return false
  if (isFounderSuperAdminEmail(targetEmail)) return false
  if (targetRole === "SUPER_ADMIN") return false
  if (isSuperAdmin(actorRole)) return true
  if (actorRole === "ORG_OWNER") return targetRole === "USER" || targetRole === "ADMIN"
  return targetRole === "USER"
}

export const getAssignableRoles = (actorRole?: string | null): Role[] => {
  if (isSuperAdmin(actorRole)) return ["USER", "ADMIN", "ORG_OWNER"]
  if (actorRole === "ORG_OWNER") return ["USER", "ADMIN"]
  if (actorRole === "ADMIN") return ["USER"]
  return ["USER"]
}
