import { NextResponse } from "next/server"
import { ACCESS_MODULE_LABELS, type AccessLevel, type AccessModule, hasModuleAccess } from "@/lib/access-control"
import { getUserFromRequest, isRequestUserError, RequestUserError } from "@/lib/request-user"

export const requireModuleAccess = async (
  request: Request,
  module: AccessModule,
  required: AccessLevel = "view",
) => {
  const context = await getUserFromRequest(request)

  if (!hasModuleAccess(context.user, module, required)) {
    const label = ACCESS_MODULE_LABELS[module]
    throw new RequestUserError(`${label} ${required} access required`, 403)
  }

  return context
}

export const handleAccessRouteError = (error: unknown, fallback: string) => {
  console.error(fallback, error)
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}
