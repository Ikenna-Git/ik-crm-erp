import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import speakeasy from "speakeasy"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No active session" }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true
      }
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json({ error: "2FA not enabled" }, { status: 400 })
    }

    // Verify the TOTP token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time windows (30 seconds each)
    })

    if (!verified) {
      // Check backup codes
      if (user.twoFactorBackupCodes.includes(token.toUpperCase())) {
        // Remove the used backup code
        const updatedCodes = user.twoFactorBackupCodes.filter(code => code !== token.toUpperCase())
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: updatedCodes }
        })
      } else {
        return NextResponse.json({ error: "Invalid token" }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("2FA login verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}