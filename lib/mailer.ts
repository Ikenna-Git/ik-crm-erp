import nodemailer from "nodemailer"

const REQUIRED_SMTP_ENVS = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"] as const

export type MailSendResult = {
  sent: boolean
  skipped?: boolean
  error?: string
}

export const getMissingSmtpConfig = () => REQUIRED_SMTP_ENVS.filter((key) => !process.env[key])

export const isSmtpConfigured = () => getMissingSmtpConfig().length === 0

export const sendTransactionalEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<MailSendResult> => {
  const missing = getMissingSmtpConfig()
  if (missing.length > 0) {
    return {
      sent: false,
      skipped: true,
      error: `Missing SMTP configuration: ${missing.join(", ")}`,
    }
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
      to,
      subject,
      text,
      html,
    })

    return { sent: true }
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Email send failed",
    }
  }
}
