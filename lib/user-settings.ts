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

export const userUpdatedEventName = "civis-user-updated"
export const themeUpdatedEventName = "civis-theme-updated"

export const getSessionHeaders = (userOverride?: { email?: string | null; name?: string | null }) => {
  if (userOverride?.email || userOverride?.name) {
    const headers: Record<string, string> = {}
    if (userOverride.email) headers["x-user-email"] = userOverride.email
    if (userOverride.name) headers["x-user-name"] = userOverride.name
    return headers
  }
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return {}
    const user = JSON.parse(raw)
    const headers: Record<string, string> = {}
    if (user?.email) headers["x-user-email"] = user.email
    if (user?.name) headers["x-user-name"] = user.name
    return headers
  } catch {
    return {}
  }
}

export const syncLocalUser = (profile: UserProfile) => {
  if (typeof window === "undefined") return
  try {
    const raw = localStorage.getItem("user")
    const existing = raw ? JSON.parse(raw) : { role: "user" }
    const next = {
      ...existing,
      name: profile.name || existing.name,
      email: profile.email || existing.email,
    }
    localStorage.setItem("user", JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(userUpdatedEventName, { detail: next }))
  } catch {
    // ignore storage errors
  }
}

export const applyThemePreference = (theme: ThemePreference) => {
  if (typeof window === "undefined") return
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
  localStorage.setItem("theme", resolved)
  window.dispatchEvent(new CustomEvent(themeUpdatedEventName, { detail: resolved }))
}
