import { NextRequest, NextResponse } from "next/server"
import { completeCredentialsSignup } from "@/lib/credentials-signup"
import { logServerEvent } from "@/lib/observability"
import { allowDevAuthFallback } from "@/lib/runtime-flags"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const limit = await rateLimit(getRateLimitKey(request, "auth-signup"), {
      limit: 10,
      windowMs: 60_000,
      strictInProduction: true,
      action: "auth.signup",
    })
    if (!limit.ok) {
      if (limit.reason === "exceeded") {
        void logServerEvent({
          level: "warning",
          category: "auth",
          action: "auth.signup.rate_limited",
          message: "Signup request was rate limited.",
          request,
        })
      }
      return createRateLimitErrorResponse(limit, {
        exceeded: "Too many signup attempts. Please wait a minute and try again.",
        unavailable: "Signup protection is not configured correctly right now. Try again later.",
      })
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
      void logServerEvent({
        level: "warning",
        category: "auth",
        action: "auth.signup.rejected",
        message: "Signup was rejected by server validation.",
        request,
        metadata: { email: String(email).trim().toLowerCase(), status: result.status },
      })
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    })
  } catch (error) {
    void logServerEvent({
      level: "error",
      category: "auth",
      action: "auth.signup.failed",
      message: "Credentials signup failed unexpectedly.",
      request,
      error,
    })
    return NextResponse.json({ error: "Unable to create account right now" }, { status: 500 })
  }
}
