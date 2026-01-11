import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable tasks." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const tasks = await prisma.task.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ tasks })
  } catch (error) {
    console.error("Tasks fetch failed", error)
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { title, dueDate, ownerId, relatedType, relatedId } = body || {}
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })
    const org = await getDefaultOrg()
    const task = await prisma.task.create({
      data: {
        title,
        dueDate: dueDate ? new Date(dueDate) : null,
        ownerId,
        relatedType,
        relatedId,
        status: "OPEN",
        orgId: org.id,
      },
    })
    return NextResponse.json({ task })
  } catch (error) {
    console.error("Task create failed", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { id, status } = body || {}
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
    const task = await prisma.task.update({
      where: { id },
      data: { status: status || "DONE" },
    })
    return NextResponse.json({ task })
  } catch (error) {
    console.error("Task update failed", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}
