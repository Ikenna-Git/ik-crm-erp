import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable docs." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const docs = await prisma.doc.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ docs })
  } catch (error) {
    console.error("Docs fetch failed", error)
    return NextResponse.json({ error: "Failed to load docs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, content, category, mediaUrl } = body || {}
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }
    const doc = await prisma.doc.create({
      data: {
        orgId: org.id,
        title,
        content: content || "",
        category: category || null,
        mediaUrl: mediaUrl || null,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created document",
      entity: "Doc",
      entityId: doc.id,
      metadata: { title: doc.title, category: doc.category },
    })

    return NextResponse.json({ doc })
  } catch (error) {
    console.error("Docs create failed", error)
    return NextResponse.json({ error: "Failed to create doc" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, title, content, category, mediaUrl } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const doc = await prisma.doc.update({
      where: { id },
      data: {
        title,
        content,
        category: category ?? null,
        mediaUrl: mediaUrl ?? null,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated document",
      entity: "Doc",
      entityId: doc.id,
      metadata: { title: doc.title, category: doc.category },
    })

    return NextResponse.json({ doc })
  } catch (error) {
    console.error("Docs update failed", error)
    return NextResponse.json({ error: "Failed to update doc" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    const deleted = await prisma.doc.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted document",
      entity: "Doc",
      entityId: deleted.id,
      metadata: { title: deleted.title, category: deleted.category },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Docs delete failed", error)
    return NextResponse.json({ error: "Failed to delete doc" }, { status: 500 })
  }
}
