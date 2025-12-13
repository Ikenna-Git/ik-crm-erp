import { prisma } from "./prisma"

const DEFAULT_ORG_ID = "org-default"

export async function getDefaultOrg() {
  return prisma.org.upsert({
    where: { id: DEFAULT_ORG_ID },
    update: {},
    create: {
      id: DEFAULT_ORG_ID,
      name: "Ikenna",
      theme: "light",
      notifyEmail: "ikchils@gmail.com",
    },
  })
}

export { DEFAULT_ORG_ID }
