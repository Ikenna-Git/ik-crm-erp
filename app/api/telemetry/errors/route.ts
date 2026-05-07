import { NextResponse } from "next/server"
import { createAuditLog } from "@/lib/audit"
import { logServerEvent } from "@/lib/observability"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"

const safeString = (value: unknown, max = 1200) => {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const message = safeString(body?.message, 600)
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  let orgId: string | null = null
  let userId: string | null = null
  let userEmail: string | null = null

  try {
    if (process.env.DATABASE_URL) {
      const { org, user } = await getUserFromRequest(request)
      orgId = org.id
      userId = user.id
      userEmail = user.email
    }
  } catch (error) {
    if (!isRequestUserError(error) || error.status !== 401) {
      console.error("Telemetry identity lookup failed", error)
    }
  }

  const metadata = {
    message,
    stack: safeString(body?.stack, 5000) || null,
    href: safeString(body?.href, 1000) || null,
    source: safeString(body?.source, 300) || null,
    userEmail,
    userAgent: safeString(request.headers.get("user-agent"), 500) || null,
  }

  await logServerEvent({
    level: "error",
    category: "telemetry",
    action: "telemetry.client_error",
    message: "Client runtime error received by telemetry endpoint.",
    request,
    actor: userId ? { id: userId, email: userEmail } : null,
    orgId,
    metadata,
  })

  if (process.env.DATABASE_URL && orgId) {
    await createAuditLog({
      orgId,
      userId,
      action: "telemetry.client_error",
      entity: "ClientError",
      metadata,
    })
  }

  return NextResponse.json({ ok: true })
}
