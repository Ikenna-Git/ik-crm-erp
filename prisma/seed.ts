import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@ikenna.local' },
    update: {},
    create: {
      email: 'admin@ikenna.local',
      name: 'Admin',
      password,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
