import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { hasBillingFeature } from "@/lib/billing"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"
import { createAuditLog } from "@/lib/audit"
import { captureServerError, logServerEvent } from "@/lib/observability"
import { assertActionAccess } from "@/lib/rbac"
import { isSuperAdmin } from "@/lib/authz"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

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
    const { org, user } = await requireAdminRequest(request)
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "webhooks.manage" })
    if (!isSuperAdmin(user.role) && !hasBillingFeature(org, "webhooks.manage")) {
      return NextResponse.json({ error: "Webhooks are not available on this billing plan yet." }, { status: 403 })
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
    const accessResponse = handleAccessRouteError(error)
    if (accessResponse) return accessResponse
    void captureServerError({
      action: "webhooks.fetch.failed",
      message: "Webhook fetch failed.",
      request,
      error,
    })
    return NextResponse.json({ error: "Failed to load webhooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireAdminRequest(request)
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "webhooks.manage" })
    if (!isSuperAdmin(user.role) && !hasBillingFeature(org, "webhooks.manage")) {
      return NextResponse.json({ error: "Webhooks are not available on this billing plan yet." }, { status: 403 })
    }
    const limit = await rateLimit(getRateLimitKey(request, "webhook-create", { orgId: org.id, userId: user.id }), {
      limit: 20,
      windowMs: 60_000,
      strictInProduction: true,
      action: "webhooks.create",
    })
    if (!limit.ok) {
      return createRateLimitErrorResponse(limit, {
        exceeded: "Rate limit exceeded. Please wait and try again.",
        unavailable: "Webhook protection is not configured correctly right now. Try again later.",
      })
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

    void logServerEvent({
      level: "info",
      category: "webhook",
      action: "webhooks.created",
      message: "Webhook endpoint was created.",
      request,
      actor: { id: user.id, email: user.email, role: user.role },
      orgId: org.id,
      metadata: { webhookId: webhook.id, name: webhook.name },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    const accessResponse = handleAccessRouteError(error)
    if (accessResponse) return accessResponse
    void captureServerError({
      action: "webhooks.create.failed",
      message: "Webhook create failed.",
      request,
      error,
    })
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireAdminRequest(request)
    await assertActionAccess({ request, subject: user, orgId: org.id, action: "webhooks.manage" })
    if (!isSuperAdmin(user.role) && !hasBillingFeature(org, "webhooks.manage")) {
      return NextResponse.json({ error: "Webhooks are not available on this billing plan yet." }, { status: 403 })
    }
    const limit = await rateLimit(getRateLimitKey(request, "webhook-update", { orgId: org.id, userId: user.id }), {
      limit: 20,
      windowMs: 60_000,
      strictInProduction: true,
      action: "webhooks.update",
    })
    if (!limit.ok) {
      return createRateLimitErrorResponse(limit, {
        exceeded: "Rate limit exceeded. Please wait and try again.",
        unavailable: "Webhook protection is not configured correctly right now. Try again later.",
      })
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

    void logServerEvent({
      level: "info",
      category: "webhook",
      action: "webhooks.updated",
      message: "Webhook endpoint was updated.",
      request,
      actor: { id: user.id, email: user.email, role: user.role },
      orgId: org.id,
      metadata: { webhookId: webhook.id, active: webhook.active },
    })

    return NextResponse.json({ webhook })
  } catch (error) {
    const accessResponse = handleAccessRouteError(error)
    if (accessResponse) return accessResponse
    void captureServerError({
      action: "webhooks.update.failed",
      message: "Webhook update failed.",
      request,
      error,
    })
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}
