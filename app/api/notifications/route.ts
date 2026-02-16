import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import type { NotificationType } from "@prisma/client"

const REQUIRED_ENVS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable notifications." }, { status: 503 })

const isDev = process.env.NODE_ENV !== "production"

type NotificationRecord = {
  id: string
  orgId: string
  userId: string
  title: string
  message: string
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR"
  source: string | null
  channel: string | null
  read: boolean
  createdAt: Date
}

const globalForNotifications = globalThis as unknown as {
  civisNotifications?: Map<string, NotificationRecord[]>
}

const memoryStore = globalForNotifications.civisNotifications || new Map<string, NotificationRecord[]>()
if (isDev) globalForNotifications.civisNotifications = memoryStore

const getLocalIdentity = (request: Request) => {
  const email = request.headers.get("x-user-email")?.trim() || process.env.DEFAULT_USER_EMAIL || "ikchils@gmail.com"
  const orgId = "org-local"
  const userId = `local-${Buffer.from(email).toString("hex").slice(0, 20)}`
  return { orgId, userId, email }
}

const getStoreKey = (orgId: string, userId: string) => `${orgId}:${userId}`

const toMemoryResponse = (record: NotificationRecord) => ({
  ...record,
  createdAt: record.createdAt.toISOString(),
})

const ensureSettings = async (userId: string) =>
  prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      theme: "dark",
      density: "comfortable",
      currency: "NGN",
      landing: "dashboard",
      dateFormat: "DD/MM/YYYY",
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
      onboarding: [],
    },
  })

const sendEmail = async (to: string, subject: string, text: string) => {
  const missing = REQUIRED_ENVS.filter((key) => !process.env[key])
  if (missing.length) {
    return { sent: false, error: `Missing SMTP configuration: ${missing.join(", ")}` }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  })

  return { sent: true }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const notifications = await prisma.notification.findMany({
      where: { orgId: org.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications fetch failed", error)
    if (isDev) {
      const identity = getLocalIdentity(request)
      const key = getStoreKey(identity.orgId, identity.userId)
      const notifications = (memoryStore.get(key) || []).map(toMemoryResponse)
      return NextResponse.json({ notifications, simulated: true })
    }
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const body = await request.json().catch(() => ({}))
  const { title, description, type, deliverEmail = true, source, channel } = body || {}

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  try {
    const { org, user } = await getUserFromRequest(request)

    const normalizedType = typeof type === "string" ? type.toUpperCase() : "INFO"
    const safeType: NotificationType = ["INFO", "SUCCESS", "WARNING", "ERROR"].includes(normalizedType)
      ? (normalizedType as NotificationType)
      : "INFO"

    const notification = await prisma.notification.create({
      data: {
        orgId: org.id,
        userId: user.id,
        title,
        message: description || "",
        type: safeType,
        source: source || null,
        channel: channel || null,
      },
    })

    const settings = await ensureSettings(user.id)
    let emailStatus: { sent: boolean; error?: string } = { sent: false }

    if (deliverEmail && settings.emailNotifications) {
      try {
        const result = await sendEmail(user.email, `Civis: ${title}`, description || title)
        emailStatus = result
      } catch (err: any) {
        emailStatus = { sent: false, error: err?.message || "Email send failed" }
      }
    }

    return NextResponse.json({ notification, email: emailStatus })
  } catch (error) {
    console.error("Notification create failed", error)
    if (isDev) {
      const identity = getLocalIdentity(request)
      const key = getStoreKey(identity.orgId, identity.userId)
      const normalizedType = typeof type === "string" ? type.toUpperCase() : "INFO"
      const safeType: NotificationType = ["INFO", "SUCCESS", "WARNING", "ERROR"].includes(normalizedType)
        ? (normalizedType as NotificationType)
        : "INFO"

      const notification: NotificationRecord = {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        orgId: identity.orgId,
        userId: identity.userId,
        title,
        message: description || "",
        type: safeType,
        source: source || null,
        channel: channel || null,
        read: false,
        createdAt: new Date(),
      }

      const current = memoryStore.get(key) || []
      memoryStore.set(key, [notification, ...current].slice(0, 50))

      return NextResponse.json({
        notification: toMemoryResponse(notification),
        email: {
          sent: false,
          error: deliverEmail ? "Simulated mode: email not sent." : undefined,
        },
        simulated: true,
      })
    }
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  const body = await request.json().catch(() => ({}))
  const { id, markAll, clear } = body || {}
  try {
    const { org, user } = await getUserFromRequest(request)

    if (clear) {
      await prisma.notification.deleteMany({ where: { orgId: org.id, userId: user.id } })
    } else if (markAll) {
      await prisma.notification.updateMany({ where: { orgId: org.id, userId: user.id }, data: { read: true } })
    } else if (id) {
      await prisma.notification.update({ where: { id }, data: { read: true } })
    }

    const notifications = await prisma.notification.findMany({
      where: { orgId: org.id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Notifications update failed", error)
    if (isDev) {
      const identity = getLocalIdentity(request)
      const key = getStoreKey(identity.orgId, identity.userId)
      const current = [...(memoryStore.get(key) || [])]

      let next = current
      if (clear) {
        next = []
      } else if (markAll) {
        next = next.map((item) => ({ ...item, read: true }))
      } else if (id) {
        next = next.map((item) => (item.id === id ? { ...item, read: true } : item))
      }
      memoryStore.set(key, next)
      return NextResponse.json({ notifications: next.map(toMemoryResponse), simulated: true })
    }
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
