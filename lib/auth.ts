import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import speakeasy from "speakeasy"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
import { consumeSignupInvite, getSignupInviteDetails } from "@/lib/invitations"
import { hashPassword, verifyPassword } from "@/lib/password"

const useAdapter = process.env.NODE_ENV === "production" || process.env.NEXTAUTH_USE_ADAPTER === "true"
const allowCredentialsFallback =
  process.env.NODE_ENV !== "production" || process.env.NEXTAUTH_ALLOW_FALLBACK === "true"

const buildLocalUser = (email: string, name: string, role: string) =>
  ({
    id: `local-${Buffer.from(email).toString("hex").slice(0, 20)}`,
    name,
    email,
    role,
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
            const invite = inviteToken ? await getSignupInviteDetails(inviteToken) : null

            if (inviteToken && (!invite || invite.active || invite.email !== email)) {
              return null
            }

            const existingUser = await withPrismaRetry("auth.authorize.findUserForSignup", () =>
              prisma.user.findUnique({
                where: { email },
                select: {
                  id: true,
                  orgId: true,
                  name: true,
                  email: true,
                  role: true,
                  passwordHash: true,
                  twoFactorEnabled: true,
                  _count: {
                    select: {
                      accounts: true,
                    },
                  },
                },
              }),
            )

            if (existingUser && (existingUser.passwordHash || existingUser._count.accounts > 0)) {
              return null
            }

            if (existingUser) {
              if (!invite) {
                return null
              }

              if (existingUser.orgId !== invite.orgId) {
                return null
              }

              const updatedUser = await withPrismaRetry("auth.authorize.setPasswordForExistingUser", () =>
                prisma.user.update({
                  where: { id: existingUser.id },
                  data: {
                    name,
                    passwordHash: hashPassword(password),
                  },
                }),
              )

              await consumeSignupInvite(inviteToken!)

              return {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                twoFactorEnabled: updatedUser.twoFactorEnabled,
              } as any
            }

            const org = await getDefaultOrg()
            const createdUser = await withPrismaRetry("auth.authorize.createUser", () =>
              prisma.user.create({
                data: {
                  email,
                  name,
                  role,
                  orgId: org.id,
                  passwordHash: hashPassword(password),
                },
              }),
            )

            return {
              id: createdUser.id,
              name: createdUser.name,
              email: createdUser.email,
              role: createdUser.role,
              twoFactorEnabled: createdUser.twoFactorEnabled,
            } as any
          }

          const user = await withPrismaRetry("auth.authorize.findUserForLogin", () =>
            prisma.user.findUnique({
              where: { email },
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
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

export const authOptions: AuthOptions = {
  adapter: useAdapter ? PrismaAdapter(prisma) : undefined,
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
          twoFactorEnabled?: boolean
        }
        const authUser = user as { id?: string; role?: string; twoFactorEnabled?: boolean } | undefined
        sessionUser.id = authUser?.id || token.sub
        sessionUser.role = authUser?.role || (token as any)?.role
        sessionUser.twoFactorEnabled = authUser?.twoFactorEnabled || (token as any)?.twoFactorEnabled
      }
      return session
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        ;(token as any).role = (user as any).role
        ;(token as any).twoFactorEnabled = (user as any).twoFactorEnabled
      } else if (trigger === "update" && token.email && useAdapter) {
        try {
          const currentUser = await withPrismaRetry("auth.jwt.refreshUser", () =>
            prisma.user.findUnique({
              where: { email: token.email as string },
              select: { role: true, twoFactorEnabled: true },
            }),
          )

          if (currentUser) {
            ;(token as any).role = currentUser.role
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
