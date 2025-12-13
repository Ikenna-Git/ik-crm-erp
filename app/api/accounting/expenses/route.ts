import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const expenses = await prisma.expense.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ expenses })
}

export async function POST(request: Request) {
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
}
