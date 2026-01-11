import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable Accounting data." }, { status: 503 })

export async function GET() {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const org = await getDefaultOrg()
    const invoices = await prisma.invoice.findMany({ where: { orgId: org.id } })
    return NextResponse.json({ invoices })
  } catch (error) {
    console.error("Accounting invoices fetch failed", error)
    return NextResponse.json({ error: "Failed to load invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const body = await request.json()
    const { invoiceNumber, clientName, amount, status, dueDate } = body || {}
    if (!invoiceNumber || !clientName || typeof amount !== "number") {
      return NextResponse.json({ error: "invoiceNumber, clientName, amount required" }, { status: 400 })
    }
    const org = await getDefaultOrg()
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName,
        amount,
        status: (status || "DRAFT") as any,
        dueDate: dueDate ? new Date(dueDate) : null,
        orgId: org.id,
      },
    })
    return NextResponse.json({ invoice })
  } catch (error) {
    console.error("Accounting invoice create failed", error)
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
  }
}
