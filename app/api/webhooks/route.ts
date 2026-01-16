import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable webhooks." }, { status: 503 })

const generateSecret = () => `whsec_${crypto.randomBytes(12).toString("hex")}`

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
    })
    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("Webhook fetch failed", error)
    return NextResponse.json({ error: "Failed to load webhooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { name, url, events } = body || {}
    if (!name || !url) {
      return NextResponse.json({ error: "name and url are required" }, { status: 400 })
    }

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        orgId: org.id,
        name,
        url,
        events: Array.isArray(events) ? events : [],
        secret: generateSecret(),
        active: true,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created webhook",
      entity: "WebhookEndpoint",
      entityId: webhook.id,
      metadata: { name: webhook.name, url: webhook.url },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("Webhook create failed", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, name, url, events, active } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    const webhook = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        name: name ?? undefined,
        url: url ?? undefined,
        events: Array.isArray(events) ? events : undefined,
        active: typeof active === "boolean" ? active : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated webhook",
      entity: "WebhookEndpoint",
      entityId: webhook.id,
      metadata: { active: webhook.active },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error("Webhook update failed", error)
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}
