import { NextResponse } from "next/server"
import { ACCESS_MODULE_LABELS, type AccessLevel, type AccessModule, hasModuleAccess } from "@/lib/access-control"
import { assertBillingFeatureAccess, type BillingFeature } from "@/lib/billing"
import { getUserFromRequest, isRequestUserError, RequestUserError } from "@/lib/request-user"
import { canManageWorkspaceSettings, isAdmin, isSuperAdmin } from "@/lib/authz"
import { captureServerError, logSecurityEvent } from "@/lib/observability"

type RequestContext = Awaited<ReturnType<typeof getUserFromRequest>>

const MODULE_BILLING_FEATURES: Partial<Record<AccessModule, BillingFeature>> = {
  ai: "ai.use",
  crm: "crm.core",
  accounting: "accounting.core",
  portal: "portal.core",
  projects: "projects.core",
  hr: "hr.core",
  inventory: "inventory.core",
}

export const requireAuthenticatedRequest = async (request: Request) => getUserFromRequest(request)

export const requireModuleAccess = async (
  request: Request,
  module: AccessModule,
  required: AccessLevel = "view",
) => {
  const context = await requireAuthenticatedRequest(request)

  if (!hasModuleAccess(context.user, module, required)) {
    const label = ACCESS_MODULE_LABELS[module]
    void logSecurityEvent({
      level: "warning",
      action: "module.access.denied",
      message: `${label} ${required} access was denied.`,
      request,
      actor: { id: context.user.id, email: context.user.email, role: context.user.role },
      orgId: context.org.id,
      metadata: { module, required },
    })
    throw new RequestUserError(`${label} ${required} access required`, 403)
  }

  const billingFeature = MODULE_BILLING_FEATURES[module]
  if (billingFeature) {
    await assertBillingFeatureAccess({
      request,
      org: context.org,
      user: context.user,
      feature: billingFeature,
    })
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
    void logSecurityEvent({
      level: "warning",
      action: "module.access.denied",
      message: "No required module access combination matched.",
      request,
      actor: { id: context.user.id, email: context.user.email, role: context.user.role },
      orgId: context.org.id,
      metadata: { requirements },
    })
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
      void logSecurityEvent({
        level: "warning",
        action: "admin.access.denied",
        message: "Super admin access was denied.",
        request,
        actor: { id: context.user.id, email: context.user.email, role: context.user.role },
        orgId: context.org.id,
        metadata: { requiredRole: "SUPER_ADMIN" },
      })
      throw new RequestUserError("Super admin access required", 403)
    }
    return context
  }

  if (options?.requireWorkspaceOwner) {
    if (!canManageWorkspaceSettings(context.user.role)) {
      void logSecurityEvent({
        level: "warning",
        action: "admin.access.denied",
        message: "Organization owner access was denied.",
        request,
        actor: { id: context.user.id, email: context.user.email, role: context.user.role },
        orgId: context.org.id,
        metadata: { requiredRole: "ORG_OWNER" },
      })
      throw new RequestUserError("Organization owner access required", 403)
    }
    return context
  }

  if (!isAdmin(context.user.role)) {
    void logSecurityEvent({
      level: "warning",
      action: "admin.access.denied",
      message: "Admin access was denied.",
      request,
      actor: { id: context.user.id, email: context.user.email, role: context.user.role },
      orgId: context.org.id,
      metadata: { requiredRole: "ADMIN" },
    })
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
  void captureServerError({
    action: "route.handler.failed",
    message: fallback,
    error,
    metadata: { fallback },
  })
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
