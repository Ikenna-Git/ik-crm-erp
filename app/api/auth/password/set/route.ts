import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/request-user"
import { createAuditLog } from "@/lib/audit"
import { hashPassword, verifyPassword } from "@/lib/password"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to manage passwords." }, { status: 503 })

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user: actor } = await getUserFromRequest(request)
    const body = await request.json().catch(() => ({}))
    const currentPassword = String(body?.currentPassword || "")
    const newPassword = String(body?.newPassword || "")
    const confirmPassword = String(body?.confirmPassword || "")

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation are required" }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "New password and confirmation do not match" }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        orgId: true,
        passwordHash: true,
      },
    })

    if (!currentUser || currentUser.orgId !== org.id) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    if (currentUser.passwordHash && !verifyPassword(currentPassword, currentUser.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: actor.id },
      data: {
        passwordHash: hashPassword(newPassword),
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: actor.id,
      action: currentUser.passwordHash ? "auth.password.updated" : "auth.password.initialized",
      entity: "User",
      entityId: actor.id,
      metadata: {
        email: actor.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: currentUser.passwordHash ? "Password updated successfully." : "Password created successfully. You can now sign in with email and password.",
    })
  } catch (error) {
    console.error("Password set failed", error)
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
  }
}
