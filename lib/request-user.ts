import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const fallbackEmail = "ikchils@gmail.com"

export const getUserFromRequest = async (request: Request) => {
  const headerEmail = request.headers.get("x-user-email")?.trim()
  const headerName = request.headers.get("x-user-name")?.trim()
  const email = headerEmail || process.env.DEFAULT_USER_EMAIL || fallbackEmail
  const name = headerName || email.split("@")[0]
  const org = await getDefaultOrg()
  const defaultAdmin = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || fallbackEmail).toLowerCase()
  const role = email.toLowerCase() === defaultAdmin ? "SUPER_ADMIN" : "USER"

  const user = await withPrismaRetry("getUserFromRequest.upsertUser", () =>
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

  return { org, user }
}
