import { NextRequest, NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { verifyPassword } from "@/lib/password"

const allowCredentialsFallback =
  process.env.NODE_ENV !== "production" || process.env.NEXTAUTH_ALLOW_FALLBACK === "true"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ requires2FA: false, fallback: allowCredentialsFallback })
    }

    const user = await withPrismaRetry("auth.loginCheck.findUser", () =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          passwordHash: true,
          twoFactorEnabled: true,
        },
      }),
    )

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({
      requires2FA: user.twoFactorEnabled,
    })
  } catch (error) {
    console.error("Login precheck failed", error)

    if (allowCredentialsFallback) {
      return NextResponse.json({ requires2FA: false, fallback: true })
    }

    return NextResponse.json({ error: "Unable to verify login right now" }, { status: 500 })
  }
}
