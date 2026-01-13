import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { createDecisionTrail, expenseSnapshot } from "@/lib/decision-trails"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const expenses = await prisma.expense.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ expenses })
  } catch (error) {
    console.error("Accounting expenses fetch failed", error)
    return NextResponse.json({ error: "Failed to load expenses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { description, amount, category, date, status, submittedBy } = body || {}
    if (!description || typeof amount !== "number") {
      return NextResponse.json({ error: "description and numeric amount required" }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : "PENDING"
    const safeStatus = (["PENDING", "APPROVED", "REJECTED"].includes(normalizedStatus) ? normalizedStatus : "PENDING") as any
    const expense = await prisma.expense.create({
      data: {
        description,
        amount,
        category: category || "general",
        status: safeStatus,
        submittedBy: submittedBy || null,
        date: date ? new Date(date) : null,
        orgId: org.id,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created expense",
      entity: "Expense",
      entityId: expense.id,
      metadata: { description: expense.description, amount: expense.amount, status: expense.status },
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Accounting expense create failed", error)
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, description, amount, category, date, status, submittedBy } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const normalizedStatus = typeof status === "string" ? status.toUpperCase() : undefined
    const safeStatus =
      (normalizedStatus && ["PENDING", "APPROVED", "REJECTED"].includes(normalizedStatus) ? normalizedStatus : undefined) as any
    const previous = await prisma.expense.findUnique({ where: { id } })
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description,
        amount: typeof amount === "number" ? amount : undefined,
        category,
        status: safeStatus,
        submittedBy: submittedBy ?? undefined,
        date: date ? new Date(date) : undefined,
      },
    })
    if (previous) {
      await createDecisionTrail({
        orgId: org.id,
        userId: user.id,
        action: "Updated expense",
        entity: "Expense",
        entityId: expense.id,
        before: expenseSnapshot(previous),
        after: expenseSnapshot(expense),
      })
    }
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated expense",
      entity: "Expense",
      entityId: expense.id,
      metadata: { description: expense.description, amount: expense.amount, status: expense.status },
    })

    return NextResponse.json({ expense })
  } catch (error) {
    console.error("Accounting expense update failed", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const deleted = await prisma.expense.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted expense",
      entity: "Expense",
      entityId: deleted.id,
      metadata: { description: deleted.description, amount: deleted.amount, status: deleted.status },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Accounting expense delete failed", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
