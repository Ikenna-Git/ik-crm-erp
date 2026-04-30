import { NextResponse } from "next/server"
import { getSignupInviteDetails } from "@/lib/invitations"

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Invite token required" }, { status: 400 })
    }

    const invite = await getSignupInviteDetails(token)

    if (!invite) {
      return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 })
    }

    return NextResponse.json({ invite })
  } catch (error) {
    console.error("Invite lookup failed", error)
    return NextResponse.json({ error: "Failed to load invite" }, { status: 500 })
  }
}
