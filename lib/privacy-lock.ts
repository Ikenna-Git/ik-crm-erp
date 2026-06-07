import { timingSafeEqual } from "node:crypto"
import { hasModuleAccess } from "@/lib/access-control"

export type PrivacyModule = "hr" | "accounting"

type PrivacyConfig = {
  module: PrivacyModule
  label: string
  unlockLabel: string
  lockedDescription: string
  cookieName: string
  envKey: string
}

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

export const getPrivacyConfig = (module: string | null | undefined) => {
  if (module === "hr" || module === "accounting") return PRIVACY_CONFIG[module]
  return null
}

export const getPrivacyUnlockCookieName = (module: PrivacyModule) => PRIVACY_CONFIG[module].cookieName

export const isPrivacyUnlocked = (request: Request, module: PrivacyModule) => {
  const cookies = parseCookieHeader(request.headers.get("cookie"))
  return cookies[PRIVACY_CONFIG[module].cookieName] === "1"
}

export const canUnlockPrivacyModule = (
  subject: { role?: string | null; accessProfile?: string | null; moduleAccess?: unknown } | null | undefined,
  module: PrivacyModule,
) => hasModuleAccess(subject || {}, module, "manage")

export const verifyPrivacyPin = (module: PrivacyModule, candidate: string) => {
  const configured = process.env[PRIVACY_CONFIG[module].envKey]
  if (!configured) {
    return { ok: false as const, reason: "missing" as const }
  }

  const expected = Buffer.from(configured.trim())
  const provided = Buffer.from(String(candidate || "").trim())
  if (expected.length !== provided.length) {
    return { ok: false as const, reason: "invalid" as const }
  }

  return { ok: timingSafeEqual(expected, provided), reason: "checked" as const }
}

export const getPrivacyLockedCopy = (module: PrivacyModule) => ({
  title: `${PRIVACY_CONFIG[module].label} locked`,
  description: PRIVACY_CONFIG[module].lockedDescription,
})

export const getPrivacyUnlockEnvKey = (module: PrivacyModule) => PRIVACY_CONFIG[module].envKey
