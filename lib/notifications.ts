import { getSessionHeaders } from "@/lib/user-settings"

export type NotificationItem = {
  id: string
  title: string
  description?: string
  source?: string
  channel?: string
  createdAt: string
  read: boolean
  type?: string
}

export const notificationsEventName = "civis-notifications-updated"

const notifyUpdate = () => {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(notificationsEventName))
}

const parseNotification = (item: any): NotificationItem => ({
  id: item.id,
  title: item.title,
  description: item.message || "",
  source: item.source || undefined,
  channel: item.channel || undefined,
  createdAt: item.createdAt,
  read: Boolean(item.read),
  type: item.type || undefined,
})

export const getNotifications = async (): Promise<NotificationItem[]> => {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/notifications", {
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.notifications) ? data.notifications.map(parseNotification) : []
  } catch {
    return []
  }
}

export const addNotification = async (payload: {
  title: string
  description?: string
  type?: string
  source?: string
  channel?: string
  deliverEmail?: boolean
}) => {
  if (typeof window === "undefined") return null
  try {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return null
    notifyUpdate()
    const data = await res.json()
    return data.notification ? parseNotification(data.notification) : null
  } catch {
    return null
  }
}

export const markNotificationRead = async (id: string) => {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) return []
    notifyUpdate()
    const data = await res.json()
    return Array.isArray(data.notifications) ? data.notifications.map(parseNotification) : []
  } catch {
    return []
  }
}

export const markAllNotificationsRead = async () => {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      body: JSON.stringify({ markAll: true }),
    })
    if (!res.ok) return []
    notifyUpdate()
    const data = await res.json()
    return Array.isArray(data.notifications) ? data.notifications.map(parseNotification) : []
  } catch {
    return []
  }
}

export const clearNotifications = async () => {
  if (typeof window === "undefined") return []
  try {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getSessionHeaders() },
      body: JSON.stringify({ clear: true }),
    })
    if (!res.ok) return []
    notifyUpdate()
    return []
  } catch {
    return []
  }
}
