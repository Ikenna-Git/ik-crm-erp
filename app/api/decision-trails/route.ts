import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable decision trails." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const trails = await prisma.decisionTrail.findMany({
      where: { orgId: org.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ trails })
  } catch (error) {
    console.error("Decision trails fetch failed", error)
    return NextResponse.json({ error: "Failed to load decision trails" }, { status: 500 })
  }
}
