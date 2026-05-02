import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable docs." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "docs", "view")
    const docs = await prisma.doc.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ docs })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load docs")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "docs", "manage")
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
    return handleAccessRouteError(error, "Failed to create doc")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "docs", "manage")
    const body = await request.json()
    const { id, title, content, category, mediaUrl } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const existingDoc = await prisma.doc.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    const doc = await prisma.doc.update({
      where: { id: existingDoc.id },
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
    return handleAccessRouteError(error, "Failed to update doc")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "docs", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    const existingDoc = await prisma.doc.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingDoc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }
    const deleted = await prisma.doc.delete({ where: { id: existingDoc.id } })
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
    return handleAccessRouteError(error, "Failed to delete doc")
  }
}
