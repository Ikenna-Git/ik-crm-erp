import { NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"

export async function GET() {
  const startedAt = Date.now()
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        status: "down",
        reason: "DATABASE_URL is not configured",
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    )
  }

  try {
    await withPrismaRetry("health.db.ping", () => prisma.$queryRaw`SELECT 1`, 2)
    return NextResponse.json({
      ok: true,
      status: "up",
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown database error"
    return NextResponse.json(
      {
        ok: false,
        status: "down",
        latencyMs: Date.now() - startedAt,
        error: process.env.NODE_ENV === "development" ? detail : "Database connection failed",
      },
      { status: 503 },
    )
  }
}

