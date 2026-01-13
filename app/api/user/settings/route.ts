import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { getDefaultKpis } from "@/lib/kpis"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable user settings." }, { status: 503 })

const DEFAULT_SETTINGS = {
  theme: "dark",
  density: "comfortable",
  currency: "NGN",
  landing: "dashboard",
  dateFormat: "DD/MM/YYYY",
  kpiLayout: [],
  emailNotifications: true,
  productNotifications: true,
  securityNotifications: true,
  reminderNotifications: true,
  marketingNotifications: false,
  smsNotifications: false,
}

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

const toPreferences = (settings: typeof DEFAULT_SETTINGS) => ({
  theme: settings.theme,
  density: settings.density,
  currency: settings.currency,
  landing: settings.landing,
  dateFormat: settings.dateFormat,
})

const toNotifications = (settings: typeof DEFAULT_SETTINGS) => ({
  email: settings.emailNotifications,
  product: settings.productNotifications,
  security: settings.securityNotifications,
  reminders: settings.reminderNotifications,
  marketing: settings.marketingNotifications,
  sms: settings.smsNotifications,
})

const ensureSettings = async (userId: string, role: string) =>
  prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...DEFAULT_SETTINGS,
      kpiLayout: getDefaultKpis(role),
    },
  })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { user } = await getUserFromRequest(request)
    const settings = await ensureSettings(user.id, user.role)
    return NextResponse.json({
      profile: toProfile(user),
      preferences: toPreferences(settings),
      notifications: toNotifications(settings),
      kpis: settings.kpiLayout || getDefaultKpis(user.role),
    })
  } catch (error) {
    console.error("User settings fetch failed", error)
    return NextResponse.json({ error: "Failed to load user settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { profile = {}, preferences = {}, notifications = {}, kpis } = body || {}

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
    if (kpis !== undefined) settingsUpdates.kpiLayout = kpis

    if (notifications.email !== undefined) settingsUpdates.emailNotifications = notifications.email
    if (notifications.product !== undefined) settingsUpdates.productNotifications = notifications.product
    if (notifications.security !== undefined) settingsUpdates.securityNotifications = notifications.security
    if (notifications.reminders !== undefined) settingsUpdates.reminderNotifications = notifications.reminders
    if (notifications.marketing !== undefined) settingsUpdates.marketingNotifications = notifications.marketing
    if (notifications.sms !== undefined) settingsUpdates.smsNotifications = notifications.sms

    const updatedSettings = Object.keys(settingsUpdates).length
      ? await prisma.userSettings.upsert({
          where: { userId: user.id },
          update: settingsUpdates,
          create: {
            userId: user.id,
            ...DEFAULT_SETTINGS,
            ...settingsUpdates,
          },
        })
      : await ensureSettings(user.id, user.role)

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
      },
    })

    return NextResponse.json({
      profile: toProfile(updatedUser),
      preferences: toPreferences(updatedSettings as typeof DEFAULT_SETTINGS),
      notifications: toNotifications(updatedSettings as typeof DEFAULT_SETTINGS),
      kpis: (updatedSettings as typeof DEFAULT_SETTINGS).kpiLayout || getDefaultKpis(user.role),
    })
  } catch (error) {
    console.error("User settings update failed", error)
    return NextResponse.json({ error: "Failed to update user settings" }, { status: 500 })
  }
}
