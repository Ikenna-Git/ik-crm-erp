import { NextRequest, NextResponse } from "next/server"
import { prisma, withPrismaRetry } from "@/lib/prisma"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
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

    if (allowCredentialsFallback) {
      return NextResponse.json({ requires2FA: false, fallback: true })
    }

    return NextResponse.json({ error: "Unable to verify login right now" }, { status: 500 })
  }
}
