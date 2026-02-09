import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/request-user"
import { buildAccountingSummary, buildCrmSummary, buildVatSummary } from "@/lib/report-builders"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable reports." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    if (type === "accounting") {
      const summary = await buildAccountingSummary(org.id)
      return NextResponse.json({ summary })
    }

    if (type === "crm") {
      const summary = await buildCrmSummary(org.id)
      return NextResponse.json({ summary })
    }

    if (type === "vat") {
      const summary = await buildVatSummary(org.id)
      return NextResponse.json({ summary })
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error) {
    console.error("Report summary fetch failed", error)
    return NextResponse.json({ error: "Failed to load report summary" }, { status: 500 })
  }
}
