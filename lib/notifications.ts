export type NotificationItem = {
  id: string
  title: string
  description?: string
  source?: string
  channel?: "in-app" | "email"
  createdAt: string
  read: boolean
}

const STORAGE_KEY = "civis_notifications"
export const notificationsEventName = "civis-notifications-updated"

const readNotifications = (): NotificationItem[] => {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeNotifications = (notifications: NotificationItem[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    window.dispatchEvent(new CustomEvent(notificationsEventName, { detail: notifications }))
  } catch {
    // ignore storage errors
  }
}

export const getNotifications = () => readNotifications()

export const addNotification = (
  payload: Omit<NotificationItem, "id" | "createdAt" | "read">,
) => {
  if (typeof window === "undefined") return null
  const existing = readNotifications()
  const entry: NotificationItem = {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...payload,
  }
  const next = [entry, ...existing]
  writeNotifications(next)
  return entry
}

export const markNotificationRead = (id: string) => {
  if (typeof window === "undefined") return []
  const existing = readNotifications()
  const next = existing.map((item) => (item.id === id ? { ...item, read: true } : item))
  writeNotifications(next)
  return next
}

export const markAllNotificationsRead = () => {
  if (typeof window === "undefined") return []
  const existing = readNotifications()
  const next = existing.map((item) => ({ ...item, read: true }))
  writeNotifications(next)
  return next
}

export const clearNotifications = () => {
  if (typeof window === "undefined") return []
  writeNotifications([])
  return []
}
