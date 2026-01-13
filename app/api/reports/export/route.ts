import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { generateCsv } from "@/lib/reports"
import { buildAccountingRows, buildCrmRows } from "@/lib/report-builders"
import { getDefaultOrg } from "@/lib/defaultOrg"

const REQUIRED_ENVS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const

type ExportBody = {
  type?: "analytics" | "accounting" | "crm"
  target?: "desktop" | "email"
  email?: string
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Database not configured. Set DATABASE_URL to enable report exports." },
      { status: 503 },
    )
  }
  const body = (await request.json()) as ExportBody
  const { type, target, email } = body

  if (!type || !["analytics", "accounting", "crm"].includes(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  }
  if (!target || !["desktop", "email"].includes(target)) {
    return NextResponse.json({ error: "Invalid export target" }, { status: 400 })
  }

  const org = await getDefaultOrg()
  const rows =
    type === "accounting" ? await buildAccountingRows(org.id) : type === "crm" ? await buildCrmRows(org.id) : undefined
  const csv = generateCsv(type, rows)
  const filename = `${org.name || "report"}-${type}.csv`

  // Desktop download: return CSV as attachment
  if (target === "desktop") {
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  }

  // Email path
  if (!email) {
    return NextResponse.json({ error: "Email is required for email export" }, { status: 400 })
  }

  // Ensure SMTP config is present
  const missing = REQUIRED_ENVS.filter((key) => !process.env[key])
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing SMTP configuration: ${missing.join(", ")}` },
      { status: 500 },
    )
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Civis ${type} report`,
      text: "Your requested CSV report is attached.",
      attachments: [{ filename, content: csv, contentType: "text/csv" }],
    })

    return NextResponse.json({ ok: true, message: `Report sent to ${email}` })
  } catch (err) {
    console.error("Email send failed", err)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}
