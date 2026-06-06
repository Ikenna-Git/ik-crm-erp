import { NextResponse } from "next/server"
import { ACCESS_MODULE_LABELS, type AccessLevel, type AccessModule, hasModuleAccess } from "@/lib/access-control"
import { canManageWorkspaceSettings, canViewFounderControls, isAdmin } from "@/lib/authz"
import { getUserFromRequest, isRequestUserError, RequestUserError } from "@/lib/request-user"

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

export const requireAdminRequest = async (
  request: Request,
  options?: {
    requireWorkspaceOwner?: boolean
    requireSuperAdmin?: boolean
  },
) => {
  const context = await requireAuthenticatedRequest(request)

  if (options?.requireSuperAdmin) {
    if (!canViewFounderControls(context.user.role, context.user.email)) {
      throw new RequestUserError("Super admin access required", 403)
    }
    return context
  }

  if (options?.requireWorkspaceOwner) {
    if (!canManageWorkspaceSettings(context.user.role, context.user.email)) {
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

export const handleAccessRouteError = (error: unknown, fallback: string) => {
  console.error(fallback, error)
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
