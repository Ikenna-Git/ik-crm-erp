import { NextResponse } from "next/server"
import { ACCESS_MODULE_LABELS, type AccessLevel, type AccessModule, hasModuleAccess } from "@/lib/access-control"
import { getUserFromRequest, isRequestUserError, RequestUserError } from "@/lib/request-user"
import { canManageWorkspaceSettings, isAdmin, isSuperAdmin } from "@/lib/authz"

type RequestContext = Awaited<ReturnType<typeof getUserFromRequest>>

export const requireAuthenticatedRequest = async (request: Request) => getUserFromRequest(request)

export const requireModuleAccess = async (
  request: Request,
  module: AccessModule,
  required: AccessLevel = "view",
) => {
  const context = await requireAuthenticatedRequest(request)

  if (!hasModuleAccess(context.user, module, required)) {
    const label = ACCESS_MODULE_LABELS[module]
    throw new RequestUserError(`${label} ${required} access required`, 403)
  }

  return context
}

export const requireAnyModuleAccess = async (
  request: Request,
  requirements: Array<{ module: AccessModule; level?: AccessLevel }>,
) => {
  const context = await requireAuthenticatedRequest(request)
  const matched = requirements.find((entry) => hasModuleAccess(context.user, entry.module, entry.level || "view"))

  if (!matched) {
    const labels = requirements.map((entry) => `${ACCESS_MODULE_LABELS[entry.module]} ${entry.level || "view"}`)
    throw new RequestUserError(`${labels.join(" or ")} access required`, 403)
  }

  return context
}

export const requireAdminRequest = async (
  request: Request,
  options?: {
    requireWorkspaceOwner?: boolean
    requireSuperAdmin?: boolean
  },
) => {
  const context = await requireAuthenticatedRequest(request)

  if (options?.requireSuperAdmin) {
    if (!isSuperAdmin(context.user.role)) {
      throw new RequestUserError("Super admin access required", 403)
    }
    return context
  }

  if (options?.requireWorkspaceOwner) {
    if (!canManageWorkspaceSettings(context.user.role)) {
      throw new RequestUserError("Organization owner access required", 403)
    }
    return context
  }

  if (!isAdmin(context.user.role)) {
    throw new RequestUserError("Admin access required", 403)
  }

  return context
}

export const assertSameOrg = (context: RequestContext, entityOrgId?: string | null, label = "Record") => {
  if (!entityOrgId || entityOrgId !== context.org.id) {
    throw new RequestUserError(`${label} does not belong to this workspace`, 403)
  }
}

export const handleAccessRouteError = (error: unknown, fallback = "Request failed") => {
  console.error(fallback, error)
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
