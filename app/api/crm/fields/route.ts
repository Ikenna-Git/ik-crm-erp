import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable CRM fields." }, { status: 503 })

const toEntity = (value?: string | null) => {
  if (!value) return null
  const upper = value.toUpperCase()
  if (upper === "CONTACT" || upper === "COMPANY" || upper === "DEAL") return upper
  return null
}

const toFieldType = (value?: string | null) => {
  if (!value) return null
  const upper = value.toUpperCase()
  const allowed = ["TEXT", "NUMBER", "CURRENCY", "DATE", "SELECT", "MULTISELECT", "CHECKBOX"]
  return allowed.includes(upper) ? upper : null
}

const isSelectType = (type: string | null) => type === "SELECT" || type === "MULTISELECT"

const toOptions = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return undefined
}

const mapCreateError = (error: unknown) => {
  const prismaError = error as { code?: string; meta?: Record<string, unknown> }
  if (prismaError?.code === "P2002") {
    return { status: 409, error: "A field with this name already exists. Try a different name." }
  }
  if (prismaError?.code === "P2021") {
    return { status: 500, error: "CRM fields are not ready yet. Run your Prisma migrations and try again." }
  }
  if (prismaError?.code === "P2022") {
    return { status: 500, error: "CRM fields schema mismatch. Run prisma migrate to update the database." }
  }
  return null
}

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

const ensureUniqueKey = async (orgId: string, entity: string, base: string) => {
  let key = base || `field_${Date.now()}`
  let suffix = 1
  while (true) {
    const existing = await prisma.crmField.findFirst({ where: { orgId, entity: entity as any, key } })
    if (!existing) return key
    suffix += 1
    key = `${base}_${suffix}`
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const entity = toEntity(searchParams.get("entity"))
    if (!entity) {
      return NextResponse.json({ error: "entity must be contact, company, or deal" }, { status: 400 })
    }
    const fields = await prisma.crmField.findMany({
      where: { orgId: org.id, entity: entity as any, archived: false },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    })
    return NextResponse.json({ fields })
  } catch (error) {
    console.error("CRM fields fetch failed", error)
    return NextResponse.json({ error: "Failed to load CRM fields" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const limit = rateLimit(getRateLimitKey(request, "crm-fields"), { limit: 20, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many field changes. Please wait and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const entity = toEntity(body?.entity)
    const type = toFieldType(body?.type)
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const options = toOptions(body?.options)
    const required = Boolean(body?.required)

    if (!entity || !type || !name) {
      return NextResponse.json({ error: "entity, name, and type are required" }, { status: 400 })
    }
    if (isSelectType(type) && (!options || options.length === 0)) {
      return NextResponse.json({ error: "Options are required for select fields." }, { status: 400 })
    }

    const baseKey = slugify(name)
    const key = await ensureUniqueKey(org.id, entity, baseKey)
    const highestOrder = await prisma.crmField.findFirst({
      where: { orgId: org.id, entity: entity as any },
      orderBy: { order: "desc" },
      select: { order: true },
    })
    const order = (highestOrder?.order ?? 0) + 1

    const field = await prisma.crmField.create({
      data: {
        orgId: org.id,
        entity: entity as any,
        name,
        key,
        type: type as any,
        options,
        required,
        order,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Created CRM field",
      entity: "CrmField",
      entityId: field.id,
      metadata: { name: field.name, entity: field.entity, type: field.type },
    })

    return NextResponse.json({ field })
  } catch (error) {
    const mapped = mapCreateError(error)
    if (mapped) {
      return NextResponse.json({ error: mapped.error }, { status: mapped.status })
    }
    console.error("CRM field create failed", error)
    return NextResponse.json({ error: "Failed to create CRM field" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, name, options, required, archived, order } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }
    const updates: Record<string, any> = {}
    if (typeof name === "string" && name.trim()) updates.name = name.trim()
    if (Array.isArray(options)) updates.options = options
    if (typeof required === "boolean") updates.required = required
    if (typeof archived === "boolean") updates.archived = archived
    if (typeof order === "number") updates.order = order

    const field = await prisma.crmField.update({
      where: { id },
      data: updates,
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated CRM field",
      entity: "CrmField",
      entityId: field.id,
      metadata: { name: field.name, entity: field.entity, updates: Object.keys(updates) },
    })

    return NextResponse.json({ field })
  } catch (error) {
    console.error("CRM field update failed", error)
    return NextResponse.json({ error: "Failed to update CRM field" }, { status: 500 })
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
    const field = await prisma.crmField.update({
      where: { id },
      data: { archived: true },
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Archived CRM field",
      entity: "CrmField",
      entityId: field.id,
      metadata: { name: field.name, entity: field.entity },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("CRM field delete failed", error)
    return NextResponse.json({ error: "Failed to remove CRM field" }, { status: 500 })
  }
}
