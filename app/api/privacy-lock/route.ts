import { NextResponse } from "next/server"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import {
  canUnlockPrivacyModule,
  getPrivacyConfig,
  getPrivacyUnlockCookieName,
  isPrivacyUnlocked,
  verifyPrivacyPin,
} from "@/lib/privacy-lock"

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

const resolveModule = (request: Request, body?: { module?: string }) => {
  const url = new URL(request.url)
  return getPrivacyConfig(body?.module || url.searchParams.get("module"))
}

export async function GET(request: Request) {
  const config = resolveModule(request)
  if (!config) {
    return NextResponse.json({ error: "Valid privacy module is required." }, { status: 400 })
  }

  try {
    const { user } = await getUserFromRequest(request)
    const canUnlock = canUnlockPrivacyModule(user, config.module)
    const unlocked = canUnlock && isPrivacyUnlocked(request, config.module)
    const configured = Boolean(process.env[config.envKey])

    return NextResponse.json({
      module: config.module,
      unlockLabel: config.unlockLabel,
      unlocked,
      canUnlock,
      configured,
      message: canUnlock
        ? unlocked
          ? `${config.label} is unlocked for this session.`
          : `${config.label} is locked for this session.`
        : `${config.label} can only be unlocked by an authorized workspace manager.`,
    })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to load privacy lock state." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { module?: string; pin?: string }
  const config = resolveModule(request, body)
  if (!config) {
    return NextResponse.json({ error: "Valid privacy module is required." }, { status: 400 })
  }

  try {
    const { user } = await getUserFromRequest(request)
    if (!canUnlockPrivacyModule(user, config.module)) {
      return NextResponse.json(
        { error: `You do not have permission to unlock ${config.label.toLowerCase()}.` },
        { status: 403 },
      )
    }

    const pinCheck = verifyPrivacyPin(config.module, String(body.pin || ""))
    if (pinCheck.reason === "missing") {
      return NextResponse.json(
        { error: `${config.label} PIN is not configured yet. Add ${config.envKey} before using this lock.` },
        { status: 503 },
      )
    }
    if (!pinCheck.ok) {
      return NextResponse.json({ error: "Incorrect PIN. Try again." }, { status: 400 })
    }

    const response = NextResponse.json({
      module: config.module,
      unlocked: true,
      message: `${config.label} unlocked for this session.`,
    })
    response.cookies.set(getPrivacyUnlockCookieName(config.module), "1", cookieBase)
    return response
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to unlock privacy module." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { module?: string }
  const config = resolveModule(request, body)
  if (!config) {
    return NextResponse.json({ error: "Valid privacy module is required." }, { status: 400 })
  }

  try {
    await getUserFromRequest(request)
    const response = NextResponse.json({
      module: config.module,
      unlocked: false,
      message: `${config.label} locked again.`,
    })
    response.cookies.set(getPrivacyUnlockCookieName(config.module), "", {
      ...cookieBase,
      maxAge: 0,
    })
    return response
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to lock privacy module." }, { status: 500 })
  }
}
