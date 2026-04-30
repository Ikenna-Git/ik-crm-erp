import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import speakeasy from "speakeasy"
import qrcode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, twoFactorEnabled: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ error: "2FA already enabled" }, { status: 400 })
    }

    // Generate a secret key
    const secret = speakeasy.generateSecret({
      name: `Civis (${user.email})`,
      issuer: 'Civis CRM'
    })

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    )

    // Generate QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!)

    // Store the secret temporarily (will be confirmed later)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secret.base32,
        twoFactorBackupCodes: backupCodes
      }
    })

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes
    })
  } catch (error) {
    console.error("2FA setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}