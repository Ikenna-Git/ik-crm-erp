import { prisma, withPrismaRetry } from "@/lib/prisma"
import { getDefaultOrg } from "@/lib/defaultOrg"
import { FOUNDER_SUPER_ADMIN_EMAIL } from "@/lib/authz"
import { consumeSignupInvite, getSignupInviteDetails } from "@/lib/invitations"
import { hashPassword } from "@/lib/password"

type CompleteCredentialsSignupArgs = {
  name: string
  email: string
  password: string
  inviteToken?: string
}

type SignupResult =
  | {
      ok: true
      user: {
        id: string
        name: string
        email: string
        role: string
        twoFactorEnabled: boolean
      }
    }
  | {
      ok: false
      error: string
      status: number
    }

export const completeCredentialsSignup = async ({
  name,
  email,
  password,
  inviteToken,
}: CompleteCredentialsSignupArgs): Promise<SignupResult> => {
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedName = name.trim() || normalizedEmail.split("@")[0]
  const trimmedPassword = password.trim()
  const role = normalizedEmail === FOUNDER_SUPER_ADMIN_EMAIL ? "SUPER_ADMIN" : "USER"
  const isFounderBootstrap = normalizedEmail === FOUNDER_SUPER_ADMIN_EMAIL

  if (!normalizedEmail || !trimmedPassword) {
    return { ok: false, error: "Email and password are required", status: 400 }
  }

  const invite = inviteToken ? await getSignupInviteDetails(inviteToken) : null

  if (inviteToken && (!invite || invite.active || invite.email !== normalizedEmail)) {
    return { ok: false, error: "This invite is invalid or expired.", status: 409 }
  }

  const existingUser = await withPrismaRetry("credentialsSignup.findUser", () =>
    prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        orgId: true,
        name: true,
        email: true,
        role: true,
        passwordHash: true,
        twoFactorEnabled: true,
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    }),
  )

  if (existingUser && (existingUser.passwordHash || existingUser._count.accounts > 0)) {
    return { ok: false, error: "This account already has a sign-in method. Use login instead.", status: 409 }
  }

  if (existingUser) {
    if (!invite && !isFounderBootstrap) {
      return { ok: false, error: "This account must be activated from its invite link.", status: 409 }
    }

    if (invite && existingUser.orgId !== invite.orgId) {
      return { ok: false, error: "This invite does not match the target workspace.", status: 409 }
    }

    const updatedUser = await withPrismaRetry("credentialsSignup.updateUser", () =>
      prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: normalizedName,
          role,
          passwordHash: hashPassword(trimmedPassword),
        },
      }),
    )

    if (inviteToken) {
      await consumeSignupInvite(inviteToken)
    }

    return {
      ok: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
      },
    }
  }

  const org = await getDefaultOrg()
  const createdUser = await withPrismaRetry("credentialsSignup.createUser", () =>
    prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedName,
        role,
        orgId: org.id,
        passwordHash: hashPassword(trimmedPassword),
      },
    }),
  )

  return {
    ok: true,
    user: {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      twoFactorEnabled: createdUser.twoFactorEnabled,
    },
  }
}
