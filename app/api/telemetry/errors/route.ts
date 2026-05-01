import { NextResponse } from "next/server"
import { createAuditLog } from "@/lib/audit"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"

const safeString = (value: unknown, max = 1200) => {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 202 })
  }

  const body = await request.json().catch(() => ({}))
  const message = safeString(body?.message, 600)
  if (!message) {
    return NextResponse.json({ error: "message required" }, { status: 400 })
  }

  let orgId: string
  let userId: string | null = null
  let userEmail: string | null = null

  try {
    const { org, user } = await getUserFromRequest(request)
    orgId = org.id
    userId = user.id
    userEmail = user.email
  } catch (error) {
    if (!isRequestUserError(error) || error.status !== 401) {
      console.error("Telemetry identity lookup failed", error)
    }
    const org = await getDefaultOrg()
    orgId = org.id
  }

  await createAuditLog({
    orgId,
    userId,
    action: "telemetry.client_error",
    entity: "ClientError",
    metadata: {
      message,
      stack: safeString(body?.stack, 5000) || null,
      href: safeString(body?.href, 1000) || null,
      source: safeString(body?.source, 300) || null,
      userEmail,
      userAgent: safeString(request.headers.get("user-agent"), 500) || null,
    },
  })

  return NextResponse.json({ ok: true })
}
