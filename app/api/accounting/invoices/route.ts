import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"

export async function GET() {
  const org = await getDefaultOrg()
  const invoices = await prisma.invoice.findMany({ where: { orgId: org.id } })
  return NextResponse.json({ invoices })
}

export async function POST(request: Request) {
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
}
