import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable gallery data." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const items = await prisma.galleryItem.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Gallery fetch failed", error)
    return NextResponse.json({ error: "Failed to load gallery" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, description, url, mediaType, size } = body || {}

    if (!title || !url || !mediaType) {
      return NextResponse.json({ error: "title, url, and mediaType are required" }, { status: 400 })
    }

    const item = await prisma.galleryItem.create({
      data: {
        orgId: org.id,
        title,
        description,
        url,
        mediaType,
        size: typeof size === "number" ? size : undefined,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created gallery item",
      entity: "GalleryItem",
      entityId: item.id,
      metadata: { title: item.title, mediaType: item.mediaType },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Gallery create failed", error)
    return NextResponse.json({ error: "Failed to create gallery item" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, ...updates } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const item = await prisma.galleryItem.update({
      where: { id },
      data: {
        title: updates.title,
        description: updates.description,
        url: updates.url,
        mediaType: updates.mediaType,
        size: typeof updates.size === "number" ? updates.size : undefined,
      },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated gallery item",
      entity: "GalleryItem",
      entityId: item.id,
      metadata: { title: item.title, mediaType: item.mediaType },
    })

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Gallery update failed", error)
    return NextResponse.json({ error: "Failed to update gallery item" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    const deleted = await prisma.galleryItem.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted gallery item",
      entity: "GalleryItem",
      entityId: deleted.id,
      metadata: { title: deleted.title, mediaType: deleted.mediaType },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Gallery delete failed", error)
    return NextResponse.json({ error: "Failed to delete gallery item" }, { status: 500 })
  }
}
