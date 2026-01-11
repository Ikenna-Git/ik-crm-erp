import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const expenses = await prisma.expense.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Accounting expenses fetch failed", error)
    return NextResponse.json({ error: "Failed to load expenses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { description, amount, category, date } = body || {}
    if (!description || typeof amount !== "number") {
      return NextResponse.json({ error: "description and numeric amount required" }, { status: 400 })
    }
    const org = await getDefaultOrg()
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category: category || "general",
        date: date ? new Date(date) : null,
        orgId: org.id,
      },
    })
    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Accounting expense create failed", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
