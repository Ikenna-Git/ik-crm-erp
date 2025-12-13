import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const tasks = await prisma.task.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
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
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, status } = body || {}
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const task = await prisma.task.update({
    where: { id },
    data: { status: status || "DONE" },
  })
  return NextResponse.json({ task })
}
