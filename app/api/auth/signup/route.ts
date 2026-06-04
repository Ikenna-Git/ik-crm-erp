import { NextRequest, NextResponse } from "next/server"
import { completeCredentialsSignup } from "@/lib/credentials-signup"
import { allowDevAuthFallback } from "@/lib/runtime-flags"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limit = rateLimit(getRateLimitKey(request, "auth-signup"), { limit: 10, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const { name, email, password, inviteToken } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      if (allowDevAuthFallback) {
        return NextResponse.json({
          success: true,
          fallback: true,
          message: "Signup accepted in fallback mode. Continue to login.",
        })
      }

      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const result = await completeCredentialsSignup({
      name: String(name),
      email: String(email),
      password: String(password),
      inviteToken: inviteToken ? String(inviteToken) : undefined,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    console.error("Credentials signup failed", error)
    return NextResponse.json({ error: "Unable to create account right now" }, { status: 500 })
  }
}
