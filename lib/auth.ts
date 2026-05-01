import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { AuthOptions } from "next-auth"
import type { Adapter } from "next-auth/adapters"
import { randomUUID } from "crypto"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import speakeasy from "speakeasy"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
import { buildModuleAccessForUser, getDefaultAccessProfileForRole } from "@/lib/access-control"
import { completeCredentialsSignup } from "@/lib/credentials-signup"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { verifyPassword } from "@/lib/password"

const useAdapter = process.env.NODE_ENV === "production" || process.env.NEXTAUTH_USE_ADAPTER === "true"
const allowCredentialsFallback =
  process.env.NODE_ENV !== "production" || process.env.NEXTAUTH_ALLOW_FALLBACK === "true"

const buildLocalUser = (email: string, name: string, role: string) =>
  ({
    id: `local-${Buffer.from(email).toString("hex").slice(0, 20)}`,
    name,
    email,
    role,
    accessProfile: getDefaultAccessProfileForRole(role),
    moduleAccess: buildModuleAccessForUser({ role, accessProfile: getDefaultAccessProfileForRole(role) }),
    twoFactorEnabled: false,
  }) as any

const buildProviders = () => {
  const providers = []

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    )
  }

  providers.push(
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        twoFactorToken: { label: "Two-Factor Token", type: "text" },
        inviteToken: { label: "Invite Token", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toLowerCase().trim()
        const password = credentials?.password?.trim()
        const twoFactorToken = credentials?.twoFactorToken?.trim()
        const inviteToken = credentials?.inviteToken?.trim()
        const mode = credentials?.mode === "signup" ? "signup" : "login"

        if (!email || !password) return null

        const name = credentials?.name?.trim() || email.split("@")[0]
        const role = email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER"

        if (!useAdapter) {
          return allowCredentialsFallback ? buildLocalUser(email, name, role) : null
        }

        try {
          if (mode === "signup") {
            const signup = await completeCredentialsSignup({
              name,
              email,
              password,
              inviteToken,
            })

            return signup.ok ? (signup.user as any) : null
          }

          const user = await withPrismaRetry("auth.authorize.findUserForLogin", () =>
            prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                accessProfile: true,
                moduleAccess: true,
                passwordHash: true,
                twoFactorEnabled: true,
                twoFactorSecret: true,
                twoFactorBackupCodes: true,
              },
            }),
          )

          if (!user || !verifyPassword(password, user.passwordHash)) {
            return null
          }

          if (user.twoFactorEnabled) {
            if (!twoFactorToken || !user.twoFactorSecret) {
              return null
            }

            const verified = speakeasy.totp.verify({
              secret: user.twoFactorSecret,
              encoding: "base32",
              token: twoFactorToken,
              window: 2,
            })

            if (!verified) {
              const normalizedBackupCode = twoFactorToken.toUpperCase()
              if (!user.twoFactorBackupCodes.includes(normalizedBackupCode)) {
                return null
              }

              await withPrismaRetry("auth.authorize.consumeBackupCode", () =>
                prisma.user.update({
                  where: { id: user.id },
                  data: {
                    twoFactorBackupCodes: user.twoFactorBackupCodes.filter((code) => code !== normalizedBackupCode),
                  },
                }),
              )
            }
          }

            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              accessProfile: user.accessProfile,
              moduleAccess: user.moduleAccess,
              twoFactorEnabled: user.twoFactorEnabled,
            } as any
        } catch (error) {
          console.error("Credentials authorize failed", error)

          if (allowCredentialsFallback) {
            console.warn("Using local credentials fallback user (DB unavailable).")
            return buildLocalUser(email, name, role)
          }

          return null
        }
      },
    }),
  )

  return providers
}

const buildAdapter = (): Adapter | undefined => {
  if (!useAdapter) return undefined

  const base = PrismaAdapter(prisma)

  return {
    ...base,
    async createUser(data) {
      const org = await getDefaultOrg()
      const email = data.email?.toLowerCase().trim()

      const created = await prisma.user.create({
        data: {
          orgId: org.id,
          email: email || `user-${randomUUID()}@civis.local`,
          name: data.name?.trim() || email?.split("@")[0] || "User",
          image: data.image,
          emailVerified: data.emailVerified ?? null,
          role: email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER",
          accessProfile: getDefaultAccessProfileForRole(email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER"),
          moduleAccess: buildModuleAccessForUser({
            role: email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER",
            accessProfile: getDefaultAccessProfileForRole(email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER"),
          }),
        },
      })

      return created as any
    },
    async updateUser(data) {
      const email = data.email?.toLowerCase().trim()
      const updated = await prisma.user.update({
        where: { id: data.id },
        data: {
          email: email,
          name: data.name?.trim() || undefined,
          image: data.image,
          emailVerified: data.emailVerified ?? undefined,
          role: email === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : undefined,
          accessProfile:
            email === FOUNDER_SUPER_ADMIN_EMAIL ? getDefaultAccessProfileForRole("SUPER_ADMIN") : undefined,
          moduleAccess:
            email === FOUNDER_SUPER_ADMIN_EMAIL
              ? buildModuleAccessForUser({
                  role: "SUPER_ADMIN",
                  accessProfile: getDefaultAccessProfileForRole("SUPER_ADMIN"),
                })
              : undefined,
        },
      })

      return updated as any
    },
  }
}

export const authOptions: AuthOptions = {
  adapter: buildAdapter(),
  providers: buildProviders(),
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV !== "production",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string
          role?: string
          orgId?: string
          accessProfile?: string
          moduleAccess?: Record<string, string>
          twoFactorEnabled?: boolean
        }
        const authUser = user as
          | {
              id?: string
              role?: string
              orgId?: string
              accessProfile?: string
              moduleAccess?: Record<string, string>
              twoFactorEnabled?: boolean
            }
          | undefined
        sessionUser.id = authUser?.id || token.sub
        sessionUser.role = authUser?.role || (token as any)?.role
        sessionUser.orgId = authUser?.orgId || (token as any)?.orgId
        sessionUser.accessProfile = authUser?.accessProfile || (token as any)?.accessProfile
        sessionUser.moduleAccess = authUser?.moduleAccess || (token as any)?.moduleAccess
        sessionUser.twoFactorEnabled = authUser?.twoFactorEnabled || (token as any)?.twoFactorEnabled
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        ;(token as any).role = (user as any).role
        ;(token as any).orgId = (user as any).orgId
        ;(token as any).accessProfile = (user as any).accessProfile
        ;(token as any).moduleAccess = (user as any).moduleAccess
        ;(token as any).twoFactorEnabled = (user as any).twoFactorEnabled
      } else if (token.email && useAdapter) {
        try {
          const currentUser = await withPrismaRetry("auth.jwt.refreshUser", () =>
            prisma.user.findUnique({
              where: { email: token.email as string },
              select: { role: true, orgId: true, accessProfile: true, moduleAccess: true, twoFactorEnabled: true },
            }),
          )

          if (currentUser) {
            ;(token as any).role = currentUser.role
            ;(token as any).orgId = currentUser.orgId
            ;(token as any).accessProfile = currentUser.accessProfile
            ;(token as any).moduleAccess = currentUser.moduleAccess
            ;(token as any).twoFactorEnabled = currentUser.twoFactorEnabled
          }
        } catch (error) {
          console.error("Failed to refresh auth token claims", error)
        }
      }
      return token
    },
  },
}
