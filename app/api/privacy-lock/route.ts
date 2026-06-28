import { NextResponse } from "next/server"

import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import {
  buildSignedPrivacyUnlockCookie,
  canUnlockPrivacyModule,
  getPrivacyConfig,
  getPrivacyLockStatusForOrg,
  getPrivacyLocksAdminUrl,
  getPrivacyUnlockCookieTtlSeconds,
  getPrivacyUnlockCookieName,
  isPrivacyUnlockedForOrg,
  validatePrivacyPin,
  verifyPrivacyPinForOrg,
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
    const { org, user } = await getUserFromRequest(request)
    const canUnlock = canUnlockPrivacyModule(user, config.module)
    const [unlocked, status] = await Promise.all([
      canUnlock ? isPrivacyUnlockedForOrg({ request, orgId: org.id, module: config.module }) : Promise.resolve(false),
      getPrivacyLockStatusForOrg(org.id, config.module),
    ])
    const configured = status.configured

    const adminMessage = `Set it in Civis from Workspace Admin Center → Privacy Locks.`
    const memberMessage = `Ask an organisation owner/admin to set it in Workspace Admin Center → Privacy Locks.`

    return NextResponse.json({
      module: config.module,
      unlockLabel: config.unlockLabel,
      unlocked,
      canUnlock,
      configured,
      source: status.source,
      pinVersion: status.pinVersion,
      settingsUrl: getPrivacyLocksAdminUrl(),
      message: !configured
        ? canUnlock
          ? `${config.label} PIN is not configured for this organisation. ${adminMessage}`
          : `${config.label} PIN is not configured for this organisation. ${memberMessage}`
        : canUnlock
          ? unlocked
            ? `${config.label} unlocked for this session.`
            : `${config.label} is locked for this session.`
          : "Your role cannot unlock this privacy lock.",
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
    const { org, user } = await getUserFromRequest(request)
    if (!canUnlockPrivacyModule(user, config.module)) {
      return NextResponse.json(
        { error: `You do not have permission to unlock ${config.label.toLowerCase()}.` },
        { status: 403 },
      )
    }

    const normalizedPin = String(body.pin || "").trim()
    if (!normalizedPin) {
      return NextResponse.json({ error: `Enter the ${config.label.toLowerCase()} PIN.` }, { status: 400 })
    }

    const pinValidationError = validatePrivacyPin(normalizedPin)
    if (
      pinValidationError &&
      (pinValidationError === "PIN must be at least 6 characters." ||
        pinValidationError === "PIN must be 32 characters or fewer.")
    ) {
      return NextResponse.json({ error: pinValidationError }, { status: 400 })
    }

    const pinCheck = await verifyPrivacyPinForOrg({
      orgId: org.id,
      module: config.module,
      candidate: normalizedPin,
    })
    if (pinCheck.reason === "missing") {
      return NextResponse.json(
        {
          error: `${config.label} PIN is not configured for this organisation.`,
          settingsUrl: getPrivacyLocksAdminUrl(),
        },
        { status: 503 },
      )
    }
    if (!pinCheck.ok) {
      if (pinValidationError === "Choose a less obvious privacy PIN.") {
        return NextResponse.json({ error: pinValidationError }, { status: 400 })
      }
      return NextResponse.json(
        { error: config.module === "hr" ? "Incorrect HR PIN. Try again." : "Incorrect Accounting PIN. Try again." },
        { status: 400 },
      )
    }

    const response = NextResponse.json({
      module: config.module,
      unlocked: true,
      message: `${config.label} unlocked for this session.`,
    })
    response.cookies.set(
      getPrivacyUnlockCookieName(config.module),
      buildSignedPrivacyUnlockCookie({
        orgId: org.id,
        module: config.module,
        pinVersion: pinCheck.pinVersion ?? 0,
        ttlSeconds: getPrivacyUnlockCookieTtlSeconds(),
      }),
      {
        ...cookieBase,
        maxAge: getPrivacyUnlockCookieTtlSeconds(),
      },
    )
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: `${config.module.toUpperCase()}_PRIVACY_UNLOCKED`,
      entity: "OrgPrivacyLockSetting",
      entityId: config.module,
      metadata: { module: config.module, source: pinCheck.source },
    })
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
    const { org, user } = await getUserFromRequest(request)
    const response = NextResponse.json({
      module: config.module,
      unlocked: false,
      message: `${config.label} locked again.`,
    })
    response.cookies.set(getPrivacyUnlockCookieName(config.module), "", {
      ...cookieBase,
      maxAge: 0,
    })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: `${config.module.toUpperCase()}_PRIVACY_LOCKED`,
      entity: "OrgPrivacyLockSetting",
      entityId: config.module,
      metadata: { module: config.module },
    })
    return response
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: "Failed to lock privacy module." }, { status: 500 })
  }
}
