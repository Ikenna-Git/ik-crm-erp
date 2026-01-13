export type ThemePreference = "light" | "dark" | "system"

export type UserProfile = {
  name: string
  email: string
  title: string
  phone: string
  timezone: string
  locale: string
}

export type UserPreferences = {
  theme: ThemePreference
  density: "comfortable" | "compact"
  currency: string
  landing: string
  dateFormat: string
}

export type NotificationSettings = {
  product: boolean
  security: boolean
  reminders: boolean
  marketing: boolean
  sms: boolean
  email: boolean
}

export const DEFAULT_PROFILE: UserProfile = {
  name: "Adaeze Okafor",
  email: "adaeze@civis.io",
  title: "Operations Lead",
  phone: "+234 801 000 1234",
  timezone: "Africa/Lagos",
  locale: "en-NG",
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  density: "comfortable",
  currency: "NGN",
  landing: "dashboard",
  dateFormat: "DD/MM/YYYY",
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  product: true,
  security: true,
  reminders: true,
  marketing: false,
  sms: false,
  email: true,
}

const PROFILE_KEY = "civis_user_profile"
const PREFERENCES_KEY = "civis_user_preferences"
const NOTIFICATIONS_KEY = "civis_user_notification_settings"

const LEGACY_PROFILE_KEYS = ["civis_profile_page_profile", "civis_settings_profile"]
const LEGACY_PREFERENCES_KEYS = ["civis_profile_page_preferences", "civis_settings_preferences"]
const LEGACY_NOTIFICATION_KEYS = ["civis_settings_notifications"]

export const profileUpdatedEventName = "civis-profile-updated"
export const preferencesUpdatedEventName = "civis-preferences-updated"
export const notificationSettingsUpdatedEventName = "civis-notification-settings-updated"

const readJSON = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const writeJSON = <T>(key: string, value: T, eventName?: string) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: value }))
    }
  } catch {
    // ignore storage errors
  }
}

const getStoredUser = () => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const mergeLegacy = (keys: string[]) =>
  keys.reduce<Record<string, unknown>>((acc, key) => {
    const value = readJSON<Record<string, unknown>>(key)
    if (value && typeof value === "object") {
      return { ...acc, ...value }
    }
    return acc
  }, {})

const buildProfileSeed = () => {
  const storedUser = getStoredUser()
  return {
    ...DEFAULT_PROFILE,
    name: storedUser?.name || DEFAULT_PROFILE.name,
    email: storedUser?.email || DEFAULT_PROFILE.email,
  }
}

const syncUserStorage = (profile: UserProfile) => {
  if (typeof window === "undefined") return
  try {
    const existing = getStoredUser() || { role: "user" }
    const next = {
      ...existing,
      name: profile.name || existing.name,
      email: profile.email || existing.email,
    }
    localStorage.setItem("user", JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

const applyThemePreference = (theme: ThemePreference) => {
  if (typeof window === "undefined") return
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
  localStorage.setItem("theme", resolved)
}

export const getUserProfile = (): UserProfile => {
  if (typeof window === "undefined") return DEFAULT_PROFILE
  const seed = buildProfileSeed()
  const stored = readJSON<UserProfile>(PROFILE_KEY)
  if (stored) return { ...seed, ...stored }
  const legacy = mergeLegacy(LEGACY_PROFILE_KEYS)
  const merged = { ...seed, ...legacy }
  if (Object.keys(legacy).length) {
    writeJSON(PROFILE_KEY, merged, profileUpdatedEventName)
  }
  return merged
}

export const saveUserProfile = (updates: Partial<UserProfile>) => {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE, ...updates }
  const current = getUserProfile()
  const next = { ...current, ...updates }
  writeJSON(PROFILE_KEY, next, profileUpdatedEventName)
  syncUserStorage(next)
  return next
}

export const getUserPreferences = (): UserPreferences => {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES
  const stored = readJSON<UserPreferences>(PREFERENCES_KEY)
  if (stored) return { ...DEFAULT_PREFERENCES, ...stored }
  const legacy = mergeLegacy(LEGACY_PREFERENCES_KEYS)
  const merged = { ...DEFAULT_PREFERENCES, ...legacy }
  if (Object.keys(legacy).length) {
    writeJSON(PREFERENCES_KEY, merged, preferencesUpdatedEventName)
  }
  return merged
}

export const saveUserPreferences = (updates: Partial<UserPreferences>) => {
  if (typeof window === "undefined") return { ...DEFAULT_PREFERENCES, ...updates }
  const current = getUserPreferences()
  const next = { ...current, ...updates }
  writeJSON(PREFERENCES_KEY, next, preferencesUpdatedEventName)
  applyThemePreference(next.theme)
  return next
}

export const getNotificationSettings = (): NotificationSettings => {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS
  const stored = readJSON<NotificationSettings>(NOTIFICATIONS_KEY)
  if (stored) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...stored }
  const legacy = mergeLegacy(LEGACY_NOTIFICATION_KEYS)
  const merged = { ...DEFAULT_NOTIFICATION_SETTINGS, ...legacy }
  if (Object.keys(legacy).length) {
    writeJSON(NOTIFICATIONS_KEY, merged, notificationSettingsUpdatedEventName)
  }
  return merged
}

export const saveNotificationSettings = (updates: Partial<NotificationSettings>) => {
  if (typeof window === "undefined") return { ...DEFAULT_NOTIFICATION_SETTINGS, ...updates }
  const current = getNotificationSettings()
  const next = { ...current, ...updates }
  writeJSON(NOTIFICATIONS_KEY, next, notificationSettingsUpdatedEventName)
  return next
}
