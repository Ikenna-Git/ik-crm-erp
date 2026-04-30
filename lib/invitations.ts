import { randomBytes } from "crypto"
import type { Role } from "@prisma/client"
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
