import { randomBytes } from "crypto"
import type { Role } from "@prisma/client"
import { sendTransactionalEmail, type MailSendResult } from "@/lib/mailer"
import { prisma, withPrismaRetry } from "@/lib/prisma"

const INVITE_PREFIX = "invite"
const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7

type ParsedInviteIdentifier = {
  orgId: string
  email: string
}

export type SignupInvite = {
  token: string
  invitePath: string
  inviteUrl: string
  expiresAt: string
}

export type SignupInviteDetails = {
  token: string
  email: string
  name: string
  role: Role
  title: string | null
  orgId: string
  orgName: string
  expiresAt: string
  active: boolean
}

export type SignupInviteDelivery = MailSendResult

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const inviteIdentifier = (orgId: string, email: string) => `${INVITE_PREFIX}:${orgId}:${normalizeEmail(email)}`

const parseInviteIdentifier = (identifier: string): ParsedInviteIdentifier | null => {
  const [prefix, orgId, ...emailParts] = identifier.split(":")
  if (prefix !== INVITE_PREFIX || !orgId || emailParts.length === 0) return null

  const email = emailParts.join(":").trim().toLowerCase()
  if (!email) return null

  return { orgId, email }
}

const getInvitePath = (token: string) => `/signup?invite=${encodeURIComponent(token)}`

const joinUrl = (origin: string | undefined, path: string) => {
  if (!origin) return path
  return `${origin.replace(/\/$/, "")}${path}`
}

export const issueSignupInvite = async ({
  orgId,
  email,
  origin,
}: {
  orgId: string
  email: string
  origin?: string
}): Promise<SignupInvite> => {
  const identifier = inviteIdentifier(orgId, email)
  const token = randomBytes(24).toString("hex")
  const expires = new Date(Date.now() + INVITE_TTL_MS)

  await withPrismaRetry("invitations.issue.deleteExisting", () =>
    prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    }),
  )

  await withPrismaRetry("invitations.issue.create", () =>
    prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    }),
  )

  const invitePath = getInvitePath(token)

  return {
    token,
    invitePath,
    inviteUrl: joinUrl(origin, invitePath),
    expiresAt: expires.toISOString(),
  }
}

const loadInviteToken = async (token: string) => {
  const invite = await withPrismaRetry("invitations.load.token", () =>
    prisma.verificationToken.findUnique({
      where: { token },
    }),
  )

  if (!invite) return null

  if (invite.expires <= new Date()) {
    await withPrismaRetry("invitations.load.deleteExpired", () =>
      prisma.verificationToken.delete({
        where: { token },
      }),
    ).catch(() => undefined)
    return null
  }

  return invite
}

export const getSignupInviteDetails = async (token: string): Promise<SignupInviteDetails | null> => {
  const invite = await loadInviteToken(token)
  if (!invite) return null

  const parsed = parseInviteIdentifier(invite.identifier)
  if (!parsed) return null

  const user = await withPrismaRetry("invitations.load.user", () =>
    prisma.user.findUnique({
      where: { email: parsed.email },
      select: {
        id: true,
        orgId: true,
        email: true,
        name: true,
        role: true,
        title: true,
        passwordHash: true,
        org: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    }),
  )

  if (!user || user.orgId !== parsed.orgId) return null

  return {
    token,
    email: user.email,
    name: user.name,
    role: user.role,
    title: user.title,
    orgId: user.orgId,
    orgName: user.org.name,
    expiresAt: invite.expires.toISOString(),
    active: Boolean(user.passwordHash) || user._count.accounts > 0,
  }
}

export const consumeSignupInvite = async (token: string) => {
  await withPrismaRetry("invitations.consume", () =>
    prisma.verificationToken.delete({
      where: { token },
    }),
  ).catch(() => undefined)
}

export const sendSignupInviteEmail = async ({
  to,
  name,
  orgName,
  inviteUrl,
  expiresAt,
  sentBy,
  role,
}: {
  to: string
  name: string
  orgName: string
  inviteUrl: string
  expiresAt: string
  sentBy: string
  role: Role
}): Promise<SignupInviteDelivery> => {
  const expiresLabel = new Date(expiresAt).toLocaleString()
  const roleLabel = role === "ADMIN" ? "workspace admin" : "workspace user"
  const safeName = name.trim() || to

  const subject = `You're invited to ${orgName} on Civis`
  const text = [
    `Hi ${safeName},`,
    "",
    `${sentBy} invited you to join ${orgName} on Civis as a ${roleLabel}.`,
    "",
    `Complete your signup here: ${inviteUrl}`,
    `This link expires on ${expiresLabel}.`,
    "",
    "If you were not expecting this invitation, you can ignore this email.",
    "",
    "Civis",
  ].join("\n")

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.6;">
      <p>Hi ${safeName},</p>
      <p><strong>${sentBy}</strong> invited you to join <strong>${orgName}</strong> on Civis as a ${roleLabel}.</p>
      <p>
        <a href="${inviteUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 999px; background: #0f172a; color: #ffffff; text-decoration: none;">
          Complete signup
        </a>
      </p>
      <p>If the button does not open, use this link instead:<br /><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>This link expires on ${expiresLabel}.</p>
      <p>If you were not expecting this invitation, you can ignore this email.</p>
      <p>Civis</p>
    </div>
  `.trim()

  return sendTransactionalEmail({
    to,
    subject,
    text,
    html,
  })
}
