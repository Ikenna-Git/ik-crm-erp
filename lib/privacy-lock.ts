import { createHmac, timingSafeEqual } from "node:crypto"

import { Prisma, type PrivacyLockModule as PrismaPrivacyLockModule } from "@prisma/client"

import { hasModuleAccess } from "@/lib/access-control"
import { isAdmin } from "@/lib/authz"
import { hashPassword, verifyPassword } from "@/lib/password"
import { prisma } from "@/lib/prisma"

export type PrivacyModule = PrismaPrivacyLockModule

type PrivacyConfig = {
  module: PrivacyModule
  label: string
  unlockLabel: string
  lockedDescription: string
  cookieName: string
  envKey: string
}

export type PrivacyLockStatus = {
  module: PrivacyModule
  configured: boolean
  source: "org" | "legacy-env" | "none"
  pinVersion: number | null
  updatedAt: string | null
  updatedByUserId: string | null
  lastRotatedAt: string | null
  lastRotatedByUserId: string | null
}

type UnlockCookiePayload = {
  orgId: string
  module: PrivacyModule
  pinVersion: number
  exp: number
}

const COOKIE_TTL_SECONDS = 60 * 60 * 8
const PRIVACY_LOCKS_ADMIN_URL = "/dashboard/admin#privacy-locks"
const WEAK_PRIVACY_PINS = new Set(["000000", "111111", "123456", "12345678", "password", "qwerty", "admin", "civis"])

const PRIVACY_CONFIG: Record<PrivacyModule, PrivacyConfig> = {
  hr: {
    module: "hr",
    label: "HR privacy",
    unlockLabel: "Unlock HR privacy",
    lockedDescription: "This record is protected. Unlock HR privacy to view details.",
    cookieName: "civis_privacy_unlock_hr",
    envKey: "HR_PRIVACY_PIN",
  },
  accounting: {
    module: "accounting",
    label: "Accounting privacy",
    unlockLabel: "Unlock Accounting privacy",
    lockedDescription: "This record is protected. Unlock Accounting privacy to view details.",
    cookieName: "civis_privacy_unlock_accounting",
    envKey: "ACCOUNTING_PRIVACY_PIN",
  },
}

const parseCookieHeader = (cookieHeader?: string | null) =>
  Object.fromEntries(
    String(cookieHeader || "")
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [key, ...rest] = entry.split("=")
        return [key, decodeURIComponent(rest.join("="))]
      }),
  )

const encodeBase64Url = (value: string) => Buffer.from(value).toString("base64url")
const decodeBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8")

const getCookieSigningSecret = () =>
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || process.env.DATABASE_URL || "civis-privacy-lock"

const signPayload = (value: string) => createHmac("sha256", getCookieSigningSecret()).update(value).digest("base64url")

const getLegacyPin = (module: PrivacyModule) => process.env[PRIVACY_CONFIG[module].envKey]?.trim() || null

const readSignedUnlockCookie = (request: Request, module: PrivacyModule): UnlockCookiePayload | null => {
  const cookies = parseCookieHeader(request.headers.get("cookie"))
  const rawValue = cookies[PRIVACY_CONFIG[module].cookieName]
  if (!rawValue) return null

  const [payloadB64, signature] = rawValue.split(".")
  if (!payloadB64 || !signature) return null

  const expectedSignature = signPayload(payloadB64)
  const expectedBuffer = Buffer.from(expectedSignature)
  const providedBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== providedBuffer.length || !timingSafeEqual(expectedBuffer, providedBuffer)) {
    return null
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadB64)) as UnlockCookiePayload
    if (!payload?.orgId || !payload?.module || typeof payload?.pinVersion !== "number" || typeof payload?.exp !== "number") {
      return null
    }
    if (payload.module !== module || payload.exp <= Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const getPrivacyConfig = (module: string | null | undefined) => {
  if (module === "hr" || module === "accounting") return PRIVACY_CONFIG[module]
  return null
}

export const getPrivacyUnlockCookieName = (module: PrivacyModule) => PRIVACY_CONFIG[module].cookieName
export const getPrivacyLocksAdminUrl = () => PRIVACY_LOCKS_ADMIN_URL
export const getPrivacyUnlockCookieTtlSeconds = () => COOKIE_TTL_SECONDS

export const buildSignedPrivacyUnlockCookie = ({
  orgId,
  module,
  pinVersion,
  ttlSeconds = COOKIE_TTL_SECONDS,
}: {
  orgId: string
  module: PrivacyModule
  pinVersion: number
  ttlSeconds?: number
}) => {
  const payload = encodeBase64Url(
    JSON.stringify({
      orgId,
      module,
      pinVersion,
      exp: Date.now() + ttlSeconds * 1000,
    } satisfies UnlockCookiePayload),
  )

  return `${payload}.${signPayload(payload)}`
}

export const canUnlockPrivacyModule = (
  subject: { role?: string | null; accessProfile?: string | null; moduleAccess?: unknown } | null | undefined,
  module: PrivacyModule,
) => hasModuleAccess(subject || {}, module, "manage")

export const canManagePrivacyLockSettings = (
  subject: { role?: string | null; email?: string | null } | null | undefined,
) => Boolean(subject && isAdmin(subject.role))

export const validatePrivacyPin = (candidate: string) => {
  const normalized = String(candidate || "").trim()
  if (normalized.length < 6) return "PIN must be at least 6 characters."
  if (normalized.length > 32) return "PIN must be 32 characters or fewer."
  if (WEAK_PRIVACY_PINS.has(normalized.toLowerCase())) return "Choose a less obvious privacy PIN."
  return null
}

export const hashPrivacyPin = (candidate: string) => hashPassword(String(candidate || "").trim())

export const listPrivacyLockStatusesForOrg = async (orgId: string): Promise<PrivacyLockStatus[]> => {
  const settings = await prisma.orgPrivacyLockSetting.findMany({
    where: { orgId },
    select: {
      module: true,
      pinVersion: true,
      updatedAt: true,
      updatedByUserId: true,
      lastRotatedAt: true,
      lastRotatedByUserId: true,
    },
  })

  return (["hr", "accounting"] as const).map((module) => {
    const match = settings.find((item) => item.module === module)
    if (match) {
      return {
        module,
        configured: true,
        source: "org" as const,
        pinVersion: match.pinVersion,
        updatedAt: match.updatedAt.toISOString(),
        updatedByUserId: match.updatedByUserId,
        lastRotatedAt: match.lastRotatedAt?.toISOString() || null,
        lastRotatedByUserId: match.lastRotatedByUserId,
      }
    }

    const legacyPin = getLegacyPin(module)
    return {
      module,
      configured: Boolean(legacyPin),
      source: legacyPin ? ("legacy-env" as const) : ("none" as const),
      pinVersion: legacyPin ? 0 : null,
      updatedAt: null,
      updatedByUserId: null,
      lastRotatedAt: null,
      lastRotatedByUserId: null,
    }
  })
}

export const getPrivacyLockStatusForOrg = async (orgId: string, module: PrivacyModule): Promise<PrivacyLockStatus> => {
  const statuses = await listPrivacyLockStatusesForOrg(orgId)
  return (
    statuses.find((item) => item.module === module) || {
      module,
      configured: false,
      source: "none",
      pinVersion: null,
      updatedAt: null,
      updatedByUserId: null,
      lastRotatedAt: null,
      lastRotatedByUserId: null,
    }
  )
}

export const verifyPrivacyPinForOrg = async ({
  orgId,
  module,
  candidate,
}: {
  orgId: string
  module: PrivacyModule
  candidate: string
}) => {
  const normalizedCandidate = String(candidate || "").trim()
  const setting = await prisma.orgPrivacyLockSetting.findUnique({
    where: {
      orgId_module: {
        orgId,
        module,
      },
    },
    select: {
      pinHash: true,
      pinVersion: true,
    },
  })

  if (setting) {
    const ok = verifyPassword(normalizedCandidate, setting.pinHash)
    return {
      ok,
      reason: ok ? ("checked" as const) : ("invalid" as const),
      source: "org" as const,
      pinVersion: setting.pinVersion,
    }
  }

  const configured = getLegacyPin(module)
  if (!configured) {
    return { ok: false as const, reason: "missing" as const, source: "none" as const, pinVersion: null }
  }

  const expected = Buffer.from(configured)
  const provided = Buffer.from(normalizedCandidate)
  const ok = expected.length === provided.length && timingSafeEqual(expected, provided)
  return {
    ok,
    reason: ok ? ("checked" as const) : ("invalid" as const),
    source: "legacy-env" as const,
    pinVersion: 0,
  }
}

export const isPrivacyUnlockedForOrg = async ({
  request,
  orgId,
  module,
}: {
  request: Request
  orgId: string
  module: PrivacyModule
}) => {
  const status = await getPrivacyLockStatusForOrg(orgId, module)
  if (!status.configured || status.pinVersion === null) return false

  const payload = readSignedUnlockCookie(request, module)
  if (!payload) return false
  if (payload.orgId !== orgId || payload.module !== module) return false
  return payload.pinVersion === status.pinVersion
}

export const privacyLockAuditAction = (module: PrivacyModule, action: "set" | "rotated" | "force-locked") => {
  if (module === "hr") {
    if (action === "set") return "HR_PRIVACY_PIN_SET"
    if (action === "rotated") return "HR_PRIVACY_PIN_ROTATED"
    return "PRIVACY_LOCK_FORCE_LOCKED"
  }

  if (action === "set") return "ACCOUNTING_PRIVACY_PIN_SET"
  if (action === "rotated") return "ACCOUNTING_PRIVACY_PIN_ROTATED"
  return "PRIVACY_LOCK_FORCE_LOCKED"
}

export const privacyLockAuditMetadata = ({
  module,
  pinVersion,
  targetUserId,
}: {
  module: PrivacyModule
  pinVersion: number
  targetUserId?: string | null
}) =>
  ({
    module,
    pinVersion,
    ...(targetUserId ? { targetUserId } : {}),
  }) satisfies Prisma.InputJsonValue

export const getPrivacyLockedCopy = (module: PrivacyModule) => ({
  title: `${PRIVACY_CONFIG[module].label} locked`,
  description: PRIVACY_CONFIG[module].lockedDescription,
})

export const getPrivacyUnlockEnvKey = (module: PrivacyModule) => PRIVACY_CONFIG[module].envKey
