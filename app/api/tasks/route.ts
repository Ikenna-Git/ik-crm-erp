import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable tasks." }, { status: 503 })

const toTaskStatus = (value?: string | null): "OPEN" | "DONE" | null => {
  const upper = (value || "").toUpperCase()
  if (upper === "OPEN" || upper === "DONE") return upper as "OPEN" | "DONE"
  return null
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const tasks = await prisma.task.findMany({ where: { orgId: org.id }, orderBy: { createdAt: "desc" } })
    return NextResponse.json({ tasks })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Tasks fetch failed", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, dueDate, ownerId, relatedType, relatedId } = body || {}
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })

    let resolvedOwnerId = ownerId || user.id
    if (resolvedOwnerId) {
      const owner = await prisma.user.findFirst({ where: { id: resolvedOwnerId, orgId: org.id }, select: { id: true } })
      if (!owner) return NextResponse.json({ error: "Invalid ownerId for this organization" }, { status: 400 })
      resolvedOwnerId = owner.id
    }

    const task = await prisma.task.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId: resolvedOwnerId,
        relatedType,
        relatedId,
        status: "OPEN",
        orgId: org.id,
      },
    })
    return NextResponse.json({ task })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Task create failed", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, status } = body || {}
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const existing = await prisma.task.findFirst({ where: { id, orgId: org.id }, select: { id: true } })
    if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 })

    const normalizedStatus = toTaskStatus(status) || "DONE"
    const task = await prisma.task.update({
      where: { id },
      data: { status: normalizedStatus },
    })
    return NextResponse.json({ task })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Task update failed", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
