import { NextRequest, NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
import { verifyPassword } from "@/lib/password"
import { allowDevAuthFallback } from "@/lib/runtime-flags"

import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(getRateLimitKey(request, "auth-login-check"), { limit: 20, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const { email, password } = await request.json()

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    if (!process.env.DATABASE_URL) {
      if (allowDevAuthFallback) {
        return NextResponse.json({ requires2FA: false, fallback: true })
      }
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const user = await withPrismaRetry("auth.loginCheck.findUser", () =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          passwordHash: true,
          twoFactorEnabled: true,
          _count: {
            select: {
              accounts: true,
            },
          },
          accounts: {
            take: 1,
            select: {
              provider: true,
            },
          },
        },
      }),
    )

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!user.passwordHash) {
      if (normalizedEmail === FOUNDER_SUPER_ADMIN_EMAIL && user._count.accounts === 0) {
        return NextResponse.json(
          { error: "This founder account needs its first password. Use Sign up once with the same email to create it." },
          { status: 409 },
        )
      }

      const provider = user.accounts[0]?.provider
      if (provider) {
        const providerName = provider === "google" ? "Google" : provider
        return NextResponse.json(
          { error: `This account uses ${providerName} sign-in. Use that provider instead of a password.` },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { error: "This account has not completed password setup yet. Use the invite link or ask your admin to resend it." },
        { status: 409 },
      )
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({
      requires2FA: user.twoFactorEnabled,
    })
  } catch (error) {
    console.error("Login precheck failed", error)

    if (allowDevAuthFallback) {
      return NextResponse.json({ requires2FA: false, fallback: true })
    }

    return NextResponse.json({ error: "Unable to verify login right now" }, { status: 500 })
  }
}
