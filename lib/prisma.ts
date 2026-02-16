import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

const transientCodes = new Set(["P1001", "P1002", "P1017", "P1011", "P2024"])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const isTransientPrismaError = (error: unknown) => {
  const candidate = error as { code?: string; message?: string } | null
  const code = candidate?.code
  const message = String(candidate?.message || "").toLowerCase()

  if (code && transientCodes.has(code)) return true

  return (
    message.includes("server has closed the connection") ||
    message.includes("can't reach database server") ||
    message.includes("connection") ||
    message.includes("timed out") ||
    message.includes("socket") ||
    message.includes("terminating connection")
  )
}

export async function withPrismaRetry<T>(label: string, operation: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (!isTransientPrismaError(error) || attempt === retries) {
        throw error
      }

      console.warn(`${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying...`, error)
      try {
        await prisma.$disconnect()
      } catch {}
      try {
        await prisma.$connect()
      } catch {}
      await sleep(250 * (attempt + 1))
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`${label} failed`)
}
