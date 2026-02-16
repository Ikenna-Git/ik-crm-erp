import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const useAdapter = process.env.NODE_ENV === "production" || process.env.NEXTAUTH_USE_ADAPTER === "true"
const allowCredentialsFallback = process.env.NODE_ENV !== "production" || process.env.NEXTAUTH_ALLOW_FALLBACK === "true"

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
        mode: { label: "Mode", type: "text" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email?.toLowerCase().trim()
        if (!email) return null
        const name = credentials?.name || email.split("@")[0]
        const defaultAdmin = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || "ikchils@gmail.com").toLowerCase()
        const role = email === defaultAdmin ? "SUPER_ADMIN" : "USER"

        if (!useAdapter) {
          return {
            id: `local-${Buffer.from(email).toString("hex").slice(0, 20)}`,
            name,
            email,
            role,
          } as any
        }

        try {
          const org = await getDefaultOrg()

          const user = await withPrismaRetry("auth.authorize.upsertUser", () =>
            prisma.user.upsert({
              where: { email },
              update: { name },
              create: {
                email,
                name,
                role,
                orgId: org.id,
              },
            }),
          )

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          } as any
        } catch (error) {
          console.error("Credentials authorize failed", error)
          if (allowCredentialsFallback) {
            console.warn("Using local credentials fallback user (DB unavailable).")
            return {
              id: `local-${Buffer.from(email).toString("hex").slice(0, 20)}`,
              name,
              email,
              role,
            } as any
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
        session.user.id = (user as any)?.id || token.sub
        session.user.role = (user as any)?.role || (token as any)?.role
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        ;(token as any).role = (user as any).role
      }
      return token
    },
  },
}
