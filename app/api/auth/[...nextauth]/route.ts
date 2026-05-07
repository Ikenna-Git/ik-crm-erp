import type { NextRequest } from "next/server"
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { logServerEvent } from "@/lib/observability"
import { createRateLimitErrorResponse, getRateLimitKey, rateLimit } from "@/lib/rate-limit"

const handler = NextAuth(authOptions)

export { handler as GET }

export async function POST(request: NextRequest) {
  const limit = await rateLimit(getRateLimitKey(request, "nextauth-post"), {
    limit: 40,
    windowMs: 60_000,
    strictInProduction: true,
    action: "auth.nextauth.post",
  })

  if (!limit.ok) {
    if (limit.reason === "exceeded") {
      void logServerEvent({
        level: "warning",
        category: "auth",
        action: "auth.nextauth.rate_limited",
        message: "NextAuth POST request was rate limited.",
        request,
      })
    }
    return createRateLimitErrorResponse(limit, {
      exceeded: "Too many authentication requests. Please wait a minute and try again.",
      unavailable: "Authentication protection is not configured correctly right now. Try again later.",
    })
  }

  return handler(request)
}
