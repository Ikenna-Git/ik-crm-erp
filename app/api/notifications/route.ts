import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"

const REQUIRED_ENVS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable notifications." }, { status: 503 })

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
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { title, description, type, deliverEmail = true, source, channel } = body || {}

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const normalizedType = typeof type === "string" ? type.toUpperCase() : "INFO"
    const safeType = ["INFO", "SUCCESS", "WARNING", "ERROR"].includes(normalizedType)
      ? normalizedType
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
    let emailStatus = { sent: false as boolean, error: "" as string | undefined }

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
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, markAll, clear } = body || {}

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
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
