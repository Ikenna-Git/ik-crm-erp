import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        emailNotifications: true,
        productNotifications: true,
        // Add more notification preferences as needed
      }
    })

    return NextResponse.json(settings || {
      emailNotifications: true,
      productNotifications: true
    })
  } catch (error) {
    console.error("Get notification settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { emailNotifications, productNotifications } = await request.json()

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        emailNotifications: Boolean(emailNotifications),
        productNotifications: Boolean(productNotifications)
      },
      create: {
        userId: session.user.id,
        emailNotifications: Boolean(emailNotifications),
        productNotifications: Boolean(productNotifications)
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Update notification settings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}