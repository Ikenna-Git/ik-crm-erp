import { Role } from "@prisma/client"
import { getServerSession } from "next-auth"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { buildModuleAccessForUser, getDefaultAccessProfileForRole } from "@/lib/access-control"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { authOptions } from "@/lib/auth"
import { FOUNDER_SUPER_ADMIN_EMAIL, isSuperAdmin } from "@/lib/authz"
import { getOrgStatusMessage } from "@/lib/org-status"

const fallbackEmail = FOUNDER_SUPER_ADMIN_EMAIL
const isDev = process.env.NODE_ENV !== "production"
const allowDevHeaderIdentity = isDev && process.env.ALLOW_DEV_HEADER_IDENTITY === "true"
const allowDevDefaultIdentity = isDev && process.env.ALLOW_DEV_DEFAULT_IDENTITY === "true"

type RequestIdentity = {
  email: string
  name: string
  role: Role
}

const isRole = (value?: string | null): value is Role =>
  value === "SUPER_ADMIN" || value === "ORG_OWNER" || value === "ADMIN" || value === "USER"

const deriveRoleFromEmail = (email: string): Role => {
  return email.toLowerCase() === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER"
}

const sanitizeIdentity = (emailRaw: string, nameRaw?: string | null, roleRaw?: string | null): RequestIdentity => {
  const email = emailRaw.trim().toLowerCase()
  const name = (nameRaw || email.split("@")[0] || "user").trim()
  const role = isRole(roleRaw?.toUpperCase()) ? (roleRaw!.toUpperCase() as Role) : deriveRoleFromEmail(email)
  return { email, name, role }
}

export class RequestUserError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.name = "RequestUserError"
    this.status = status
  }
}

export const isRequestUserError = (error: unknown): error is RequestUserError => error instanceof RequestUserError

export const getSessionIdentityFromRequest = async (request: Request): Promise<RequestIdentity> => {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as
    | ({
        email?: string | null
        name?: string | null
        role?: string | null
      } & Record<string, unknown>)
    | undefined
  const sessionEmail = sessionUser?.email
  if (sessionEmail) {
    return sanitizeIdentity(sessionEmail, sessionUser?.name, sessionUser?.role)
  }

  if (allowDevHeaderIdentity) {
    const headerEmail = request.headers.get("x-user-email")?.trim()
    const headerName = request.headers.get("x-user-name")?.trim()
    if (headerEmail) {
      return sanitizeIdentity(headerEmail, headerName)
    }
  }

  if (allowDevDefaultIdentity) {
    const email = process.env.DEFAULT_USER_EMAIL || fallbackEmail
    return sanitizeIdentity(email)
  }

  throw new RequestUserError("Authentication required", 401)
}

export const getUserFromRequest = async (request: Request) => {
  if (!process.env.DATABASE_URL) {
    throw new RequestUserError("Database not configured", 503)
  }

  const identity = await getSessionIdentityFromRequest(request)

  const existingUser = await withPrismaRetry("getUserFromRequest.findUser", () =>
    prisma.user.findUnique({
      where: { email: identity.email },
      include: {
        org: true,
      },
    }),
  )

  if (existingUser) {
    const nextRole = identity.email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : existingUser.role
    const nextAccessProfile = existingUser.accessProfile || getDefaultAccessProfileForRole(nextRole)
    const nextModuleAccess = buildModuleAccessForUser({
      role: nextRole,
      accessProfile: nextAccessProfile,
      moduleAccess: existingUser.moduleAccess,
    })
    const user =
      existingUser.name !== identity.name ||
      existingUser.role !== nextRole ||
      existingUser.accessProfile !== nextAccessProfile ||
      !existingUser.moduleAccess
        ? await withPrismaRetry("getUserFromRequest.updateUser", () =>
            prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: identity.name,
                role: nextRole,
                accessProfile: nextAccessProfile,
                moduleAccess: nextModuleAccess,
              },
              include: {
                org: true,
              },
            }),
          )
        : existingUser

    if (!isSuperAdmin(nextRole)) {
      const orgStatusMessage = getOrgStatusMessage(user.org.status, user.org.statusReason)
      if (orgStatusMessage) {
        throw new RequestUserError(orgStatusMessage, 403)
      }
    }

    return { org: user.org, user }
  }

  const org = await getDefaultOrg()
  const user = await withPrismaRetry("getUserFromRequest.createUser", () =>
    prisma.user.create({
      data: {
        email: identity.email,
        name: identity.name,
        role: identity.role,
        accessProfile: getDefaultAccessProfileForRole(identity.role),
        moduleAccess: buildModuleAccessForUser({
          role: identity.role,
          accessProfile: getDefaultAccessProfileForRole(identity.role),
        }),
        orgId: org.id,
      },
      include: {
        org: true,
      },
    }),
  )

  if (!isSuperAdmin(user.role)) {
    const orgStatusMessage = getOrgStatusMessage(org.status, org.statusReason)
    if (orgStatusMessage) {
      throw new RequestUserError(orgStatusMessage, 403)
    }
  }

  return { org, user }
}
