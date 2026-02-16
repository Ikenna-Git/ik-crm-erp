import { prisma, withPrismaRetry } from "./prisma"

const DEFAULT_ORG_ID = "org-default"

export async function getDefaultOrg() {
  return withPrismaRetry("getDefaultOrg", () =>
    prisma.org.upsert({
      where: { id: DEFAULT_ORG_ID },
      update: {},
      create: {
        id: DEFAULT_ORG_ID,
        name: "Civis",
        theme: "light",
        notifyEmail: "ikchils@gmail.com",
      },
    }),
  )
}

export { DEFAULT_ORG_ID }
