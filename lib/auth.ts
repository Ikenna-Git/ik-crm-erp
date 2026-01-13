import { PrismaAdapter } from "@next-auth/prisma-adapter"
import type { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

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

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
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
        const org = await getDefaultOrg()
        const defaultAdmin = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || "ikchils@gmail.com").toLowerCase()
        const role = email === defaultAdmin ? "SUPER_ADMIN" : "USER"

        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: {
            email,
            name,
            role,
            orgId: org.id,
          },
        })

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any
      },
    }),
  )

  return providers
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: buildProviders(),
  session: { strategy: "jwt" },
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
