import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { getDefaultKpis } from "@/lib/kpis"
import { DEFAULT_CRM_VIEWS, DEFAULT_ONBOARDING_TASKS } from "@/lib/user-settings"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable user settings." }, { status: 503 })
const isDev = process.env.NODE_ENV !== "production"

const DEFAULT_SETTINGS = {
  theme: "dark",
  density: "comfortable",
  currency: "NGN",
  landing: "dashboard",
  dateFormat: "DD/MM/YYYY",
  aiProvider: "auto",
  kpiLayout: [],
  emailNotifications: true,
  productNotifications: true,
  securityNotifications: true,
  reminderNotifications: true,
  marketingNotifications: false,
  smsNotifications: false,
  digestEnabled: false,
  digestDay: "MONDAY",
  digestTime: "08:00",
  digestEmail: "",
  crmContactView: DEFAULT_CRM_VIEWS.contacts,
  crmCompanyView: DEFAULT_CRM_VIEWS.companies,
  crmDealView: DEFAULT_CRM_VIEWS.deals,
  onboarding: DEFAULT_ONBOARDING_TASKS,
}

const BASE_SETTINGS = {
  theme: DEFAULT_SETTINGS.theme,
  density: DEFAULT_SETTINGS.density,
  currency: DEFAULT_SETTINGS.currency,
  landing: DEFAULT_SETTINGS.landing,
  dateFormat: DEFAULT_SETTINGS.dateFormat,
  emailNotifications: DEFAULT_SETTINGS.emailNotifications,
  productNotifications: DEFAULT_SETTINGS.productNotifications,
  securityNotifications: DEFAULT_SETTINGS.securityNotifications,
  reminderNotifications: DEFAULT_SETTINGS.reminderNotifications,
  marketingNotifications: DEFAULT_SETTINGS.marketingNotifications,
  smsNotifications: DEFAULT_SETTINGS.smsNotifications,
  digestEnabled: DEFAULT_SETTINGS.digestEnabled,
  digestDay: DEFAULT_SETTINGS.digestDay,
  digestTime: DEFAULT_SETTINGS.digestTime,
  digestEmail: DEFAULT_SETTINGS.digestEmail,
}

const EXTENDED_SETTINGS_KEYS = new Set([
  "kpiLayout",
  "crmContactView",
  "crmCompanyView",
  "crmDealView",
  "onboarding",
  "aiProvider",
])

const stripExtendedSettings = (updates: Record<string, unknown>) => {
  const safeUpdates: Record<string, unknown> = {}
  Object.entries(updates).forEach(([key, value]) => {
    if (!EXTENDED_SETTINGS_KEYS.has(key)) {
      safeUpdates[key] = value
    }
  })
  return safeUpdates
}

const isUnknownArgumentError = (error: unknown) =>
  error instanceof Error && error.message.includes("Unknown argument")

const buildFullCreate = (userId: string, role: string, email?: string | null) => ({
  userId,
  ...DEFAULT_SETTINGS,
  digestEmail: email || DEFAULT_SETTINGS.digestEmail,
  kpiLayout: getDefaultKpis(role),
})

const buildSafeCreate = (userId: string, email?: string | null) => ({
  userId,
  ...BASE_SETTINGS,
  digestEmail: email || BASE_SETTINGS.digestEmail,
})

const toProfile = (user: {
  name: string
  email: string
  title: string | null
  phone: string | null
  timezone: string | null
  locale: string | null
}) => ({
  name: user.name || "",
  email: user.email || "",
  title: user.title || "",
  phone: user.phone || "",
  timezone: user.timezone || "Africa/Lagos",
  locale: user.locale || "en-NG",
})

const toPreferences = (settings: any) => ({
  theme: settings.theme,
  density: settings.density,
  currency: settings.currency,
  landing: settings.landing,
  dateFormat: settings.dateFormat,
  aiProvider: settings.aiProvider || DEFAULT_SETTINGS.aiProvider,
})

const toNotifications = (settings: any) => ({
  email: settings.emailNotifications,
  product: settings.productNotifications,
  security: settings.securityNotifications,
  reminders: settings.reminderNotifications,
  marketing: settings.marketingNotifications,
  sms: settings.smsNotifications,
})

const toDigest = (settings: any, email?: string | null) => ({
  enabled: settings.digestEnabled,
  day: settings.digestDay,
  time: settings.digestTime,
  email: settings.digestEmail || email || "",
})

const toOnboarding = (settings: any) =>
  Array.isArray(settings.onboarding) && settings.onboarding.length ? settings.onboarding : DEFAULT_ONBOARDING_TASKS

const toCrmViews = (settings: any) => ({
  contacts: settings.crmContactView || DEFAULT_CRM_VIEWS.contacts,
  companies: settings.crmCompanyView || DEFAULT_CRM_VIEWS.companies,
  deals: settings.crmDealView || DEFAULT_CRM_VIEWS.deals,
})

const getFallbackIdentity = (request: Request) => {
  const email = request.headers.get("x-user-email")?.trim() || process.env.DEFAULT_USER_EMAIL || "ikchils@gmail.com"
  const name = request.headers.get("x-user-name")?.trim() || email.split("@")[0]
  const defaultAdmin = (process.env.DEFAULT_SUPER_ADMIN_EMAIL || "ikchils@gmail.com").toLowerCase()
  const role = email.toLowerCase() === defaultAdmin ? "SUPER_ADMIN" : "USER"
  return { name, email, role }
}

const mergeCrmViews = (crmViews?: any) => ({
  contacts: crmViews?.contacts || DEFAULT_CRM_VIEWS.contacts,
  companies: crmViews?.companies || DEFAULT_CRM_VIEWS.companies,
  deals: crmViews?.deals || DEFAULT_CRM_VIEWS.deals,
})

const buildFallbackSettingsPayload = (
  identity: { name: string; email: string; role: string },
  overrides?: {
    profile?: Record<string, any>
    preferences?: Record<string, any>
    notifications?: Record<string, any>
    kpis?: unknown
    digest?: Record<string, any>
    onboarding?: unknown
    crmViews?: unknown
  },
) => {
  const profile = {
    ...DEFAULT_SETTINGS,
    name: identity.name,
    email: identity.email,
  } as any

  const profilePayload = {
    name: overrides?.profile?.name ?? profile.name,
    email: overrides?.profile?.email ?? profile.email,
    title: overrides?.profile?.title ?? "",
    phone: overrides?.profile?.phone ?? "",
    timezone: overrides?.profile?.timezone ?? "Africa/Lagos",
    locale: overrides?.profile?.locale ?? "en-NG",
  }

  const preferencesPayload = {
    ...DEFAULT_SETTINGS,
    ...(overrides?.preferences || {}),
  } as any

  const notificationPayload = {
    email: overrides?.notifications?.email ?? DEFAULT_SETTINGS.emailNotifications,
    product: overrides?.notifications?.product ?? DEFAULT_SETTINGS.productNotifications,
    security: overrides?.notifications?.security ?? DEFAULT_SETTINGS.securityNotifications,
    reminders: overrides?.notifications?.reminders ?? DEFAULT_SETTINGS.reminderNotifications,
    marketing: overrides?.notifications?.marketing ?? DEFAULT_SETTINGS.marketingNotifications,
    sms: overrides?.notifications?.sms ?? DEFAULT_SETTINGS.smsNotifications,
  }

  const digestPayload = {
    enabled: overrides?.digest?.enabled ?? DEFAULT_SETTINGS.digestEnabled,
    day: overrides?.digest?.day ?? DEFAULT_SETTINGS.digestDay,
    time: overrides?.digest?.time ?? DEFAULT_SETTINGS.digestTime,
    email: overrides?.digest?.email ?? identity.email,
  }

  const kpisPayload =
    Array.isArray(overrides?.kpis) && overrides?.kpis.length ? (overrides?.kpis as any[]) : getDefaultKpis(identity.role)
  const onboardingPayload =
    Array.isArray(overrides?.onboarding) && overrides?.onboarding.length
      ? (overrides?.onboarding as any[])
      : DEFAULT_ONBOARDING_TASKS

  return {
    profile: profilePayload,
    preferences: {
      theme: preferencesPayload.theme || DEFAULT_SETTINGS.theme,
      density: preferencesPayload.density || DEFAULT_SETTINGS.density,
      currency: preferencesPayload.currency || DEFAULT_SETTINGS.currency,
      landing: preferencesPayload.landing || DEFAULT_SETTINGS.landing,
      dateFormat: preferencesPayload.dateFormat || DEFAULT_SETTINGS.dateFormat,
      aiProvider: preferencesPayload.aiProvider || DEFAULT_SETTINGS.aiProvider,
    },
    notifications: notificationPayload,
    kpis: kpisPayload,
    digest: digestPayload,
    onboarding: onboardingPayload,
    crmViews: mergeCrmViews(overrides?.crmViews),
    simulated: true,
  }
}

const ensureSettings = async (userId: string, role: string, email?: string | null) => {
  try {
    return await prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: buildFullCreate(userId, role, email),
    })
  } catch (error) {
    if (!isUnknownArgumentError(error)) throw error
    console.warn("UserSettings schema mismatch. Falling back to base settings.", error)
    return prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: buildSafeCreate(userId, email),
    })
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { user } = await getUserFromRequest(request)
    const settings = await ensureSettings(user.id, user.role, user.email)
    return NextResponse.json({
      profile: toProfile(user),
      preferences: toPreferences(settings),
      notifications: toNotifications(settings),
      kpis: settings.kpiLayout || getDefaultKpis(user.role),
      digest: toDigest(settings, user.email),
      onboarding: toOnboarding(settings),
      crmViews: toCrmViews(settings),
    })
  } catch (error) {
    console.error("User settings fetch failed", error)
    if (isDev) {
      const fallback = buildFallbackSettingsPayload(getFallbackIdentity(request))
      return NextResponse.json(fallback)
    }
    return NextResponse.json({ error: "Failed to load user settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const body = await request.json().catch(() => ({}))
  try {
    const { org, user } = await getUserFromRequest(request)
    const { profile = {}, preferences = {}, notifications = {}, kpis, digest = {}, onboarding, crmViews } = body || {}

    const userUpdates: Record<string, string | null> = {}
    if (profile.name !== undefined) userUpdates.name = profile.name
    if (profile.email !== undefined) userUpdates.email = profile.email
    if (profile.title !== undefined) userUpdates.title = profile.title
    if (profile.phone !== undefined) userUpdates.phone = profile.phone
    if (profile.timezone !== undefined) userUpdates.timezone = profile.timezone
    if (profile.locale !== undefined) userUpdates.locale = profile.locale

    const updatedUser = Object.keys(userUpdates).length
      ? await prisma.user.update({ where: { id: user.id }, data: userUpdates })
      : user

    const settingsUpdates: Record<string, string | boolean | any> = {}
    if (preferences.theme !== undefined) settingsUpdates.theme = preferences.theme
    if (preferences.density !== undefined) settingsUpdates.density = preferences.density
    if (preferences.currency !== undefined) settingsUpdates.currency = preferences.currency
    if (preferences.landing !== undefined) settingsUpdates.landing = preferences.landing
    if (preferences.dateFormat !== undefined) settingsUpdates.dateFormat = preferences.dateFormat
    if (preferences.aiProvider !== undefined) settingsUpdates.aiProvider = preferences.aiProvider
    if (kpis !== undefined) settingsUpdates.kpiLayout = kpis

    if (notifications.email !== undefined) settingsUpdates.emailNotifications = notifications.email
    if (notifications.product !== undefined) settingsUpdates.productNotifications = notifications.product
    if (notifications.security !== undefined) settingsUpdates.securityNotifications = notifications.security
    if (notifications.reminders !== undefined) settingsUpdates.reminderNotifications = notifications.reminders
    if (notifications.marketing !== undefined) settingsUpdates.marketingNotifications = notifications.marketing
    if (notifications.sms !== undefined) settingsUpdates.smsNotifications = notifications.sms
    if (digest.enabled !== undefined) settingsUpdates.digestEnabled = digest.enabled
    if (digest.day !== undefined) settingsUpdates.digestDay = digest.day
    if (digest.time !== undefined) settingsUpdates.digestTime = digest.time
    if (digest.email !== undefined) settingsUpdates.digestEmail = digest.email
    if (crmViews?.contacts) settingsUpdates.crmContactView = crmViews.contacts
    if (crmViews?.companies) settingsUpdates.crmCompanyView = crmViews.companies
    if (crmViews?.deals) settingsUpdates.crmDealView = crmViews.deals
    if (onboarding !== undefined && Array.isArray(onboarding)) settingsUpdates.onboarding = onboarding

    let updatedSettings
    if (Object.keys(settingsUpdates).length) {
      const createPayload = {
        ...buildFullCreate(user.id, user.role, user.email),
        ...settingsUpdates,
      }

      try {
        updatedSettings = await prisma.userSettings.upsert({
          where: { userId: user.id },
          update: settingsUpdates,
          create: createPayload,
        })
      } catch (error) {
        if (!isUnknownArgumentError(error)) throw error
        console.warn("UserSettings schema mismatch on update. Falling back to base settings.", error)
        const safeUpdates = stripExtendedSettings(settingsUpdates)
        updatedSettings = await prisma.userSettings.upsert({
          where: { userId: user.id },
          update: safeUpdates,
          create: {
            ...buildSafeCreate(user.id, user.email),
            ...safeUpdates,
          },
        })
      }
    } else {
      updatedSettings = await ensureSettings(user.id, user.role, user.email)
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated profile & settings",
      entity: "UserSettings",
      entityId: user.id,
      metadata: {
        profile: Object.keys(userUpdates),
        preferences: Object.keys(settingsUpdates).filter(
          (key) => key.includes("Notifications") === false && key !== "kpiLayout",
        ),
        kpis: Array.isArray(kpis) ? kpis.length : undefined,
        notifications: Object.keys(settingsUpdates).filter((key) => key.includes("Notifications")),
        digest: Object.keys(settingsUpdates).filter((key) => key.includes("digest")),
        onboarding: Array.isArray(onboarding) ? onboarding.length : undefined,
      },
    })

    return NextResponse.json({
      profile: toProfile(updatedUser),
      preferences: toPreferences(updatedSettings),
      notifications: toNotifications(updatedSettings),
      kpis: updatedSettings.kpiLayout || getDefaultKpis(user.role),
      digest: toDigest(updatedSettings, user.email),
      onboarding: toOnboarding(updatedSettings),
      crmViews: toCrmViews(updatedSettings),
    })
  } catch (error) {
    console.error("User settings update failed", error)
    if (isDev) {
      const { profile = {}, preferences = {}, notifications = {}, kpis, digest = {}, onboarding, crmViews } = body || {}
      const fallback = buildFallbackSettingsPayload(getFallbackIdentity(request), {
        profile,
        preferences,
        notifications,
        kpis,
        digest,
        onboarding,
        crmViews,
      })
      return NextResponse.json(fallback)
    }
    return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 })
  }
}
