import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { isAdmin } from "@/lib/authz"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable webhooks." }, { status: 503 })

const generateSecret = () => `whsec_${crypto.randomBytes(12).toString("hex")}`

const isValidWebhookUrl = (value?: string) => {
  if (!value) return false
  try {
    const parsed = new URL(value)
    if (process.env.NODE_ENV === "production") return parsed.protocol === "https:"
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const webhooks = await prisma.webhookEndpoint.findMany({
      where: { orgId: org.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return NextResponse.json({ webhooks })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Webhook fetch failed", error)
    return NextResponse.json({ error: "Failed to load webhooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, url, events } = body || {}
    if (!name || !url) {
      return NextResponse.json({ error: "name and url are required" }, { status: 400 })
    }
    if (!isValidWebhookUrl(url)) {
      return NextResponse.json({ error: "Invalid webhook URL. Use HTTPS in production." }, { status: 400 })
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
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Webhook create failed", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    if (!isAdmin(user.role)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { id, name, url, events, active } = body || {}
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    if (url !== undefined && !isValidWebhookUrl(url)) {
      return NextResponse.json({ error: "Invalid webhook URL. Use HTTPS in production." }, { status: 400 })
    }

    const existing = await prisma.webhookEndpoint.findFirst({ where: { id, orgId: org.id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

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
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Webhook update failed", error)
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}
