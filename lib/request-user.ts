import { Role } from "@prisma/client"
import { getServerSession } from "next-auth"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { authOptions } from "@/lib/auth"

const fallbackEmail = "ikchils@gmail.com"
const isDev = process.env.NODE_ENV !== "production"
const allowDevHeaderIdentity = isDev && process.env.ALLOW_DEV_HEADER_IDENTITY === "true"
const allowDevDefaultIdentity = isDev && process.env.ALLOW_DEV_DEFAULT_IDENTITY === "true"

type RequestIdentity = {
  email: string
  name: string
  role: Role
}

const isRole = (value?: string | null): value is Role => value === "SUPER_ADMIN" || value === "ADMIN" || value === "USER"

const deriveRoleFromEmail = (email: string): Role => {
  const defaultAdmin = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || fallbackEmail).toLowerCase()
  return email.toLowerCase() === defaultAdmin ? "SUPER_ADMIN" : "USER"
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
  const sessionEmail = session?.user?.email
  if (sessionEmail) {
    return sanitizeIdentity(sessionEmail, session.user?.name, session.user?.role)
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
  const org = await getDefaultOrg()
  const user = await withPrismaRetry("getUserFromRequest.upsertUser", () =>
    prisma.user.upsert({
      where: { email: identity.email },
      update: { name: identity.name },
      create: {
        email: identity.email,
        name: identity.name,
        role: identity.role,
        orgId: org.id,
      },
    }),
  )

  return { org, user }
}
