import { NextRequest, NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
import { logServerEvent } from "@/lib/observability"
import { verifyPassword } from "@/lib/password"
import { allowDevAuthFallback } from "@/lib/runtime-flags"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(getRateLimitKey(request, "auth-login-check"), {
      limit: 20,
      windowMs: 60_000,
      strictInProduction: true,
      action: "auth.login.check",
    })
    if (!limit.ok) {
      if (limit.reason === "exceeded") {
        void logServerEvent({
          level: "warning",
          category: "auth",
          action: "auth.login.rate_limited",
          message: "Login precheck was rate limited.",
          request,
        })
      }
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many login attempts. Please wait a minute and try again.",
        unavailable: "Login protection is not configured correctly right now. Try again later.",
      })
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
      void logServerEvent({
        level: "warning",
        category: "auth",
        action: "auth.login.invalid_identity",
        message: "Login precheck failed because the account was not found.",
        request,
        metadata: { email: normalizedEmail },
      })
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
      void logServerEvent({
        level: "warning",
        category: "auth",
        action: "auth.login.invalid_password",
        message: "Login precheck failed because the password was invalid.",
        request,
        metadata: { email: normalizedEmail, userId: user.id },
      })
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    return NextResponse.json({
      requires2FA: user.twoFactorEnabled,
    })
  } catch (error) {
    void logServerEvent({
      level: "error",
      category: "auth",
      action: "auth.login.precheck_failed",
      message: "Login precheck failed unexpectedly.",
      request,
      error,
    })

    if (allowDevAuthFallback) {
      return NextResponse.json({ requires2FA: false, fallback: true })
    }

    return NextResponse.json({ error: "Unable to verify login right now" }, { status: 500 })
  }
}
