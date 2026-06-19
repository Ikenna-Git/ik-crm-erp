import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireAdminRequest } from "@/lib/access-route"
import {
  canManagePrivacyLockSettings,
  getPrivacyLocksAdminUrl,
  hashPrivacyPin,
  listPrivacyLockStatusesForOrg,
  privacyLockAuditAction,
  privacyLockAuditMetadata,
  validatePrivacyPin,
  type PrivacyModule,
} from "@/lib/privacy-lock"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable privacy lock settings." }, { status: 503 })

const mapModuleLabel = (module: PrivacyModule) => (module === "hr" ? "HR privacy PIN" : "Accounting privacy PIN")

const mapSafeStatus = async (orgId: string) => {
  const [statuses, users] = await Promise.all([
    listPrivacyLockStatusesForOrg(orgId),
    prisma.user.findMany({
      where: { orgId },
      select: { id: true, name: true, email: true },
    }),
  ])

  return statuses.map((status) => {
    const updatedBy = status.updatedByUserId ? users.find((user) => user.id === status.updatedByUserId) : null
    const rotatedBy = status.lastRotatedByUserId ? users.find((user) => user.id === status.lastRotatedByUserId) : null
    return {
      module: status.module,
      label: mapModuleLabel(status.module),
      configured: status.configured,
      source: status.source,
      pinVersion: status.pinVersion,
      updatedAt: status.updatedAt,
      updatedBy: updatedBy ? updatedBy.name || updatedBy.email : null,
      lastRotatedAt: status.lastRotatedAt,
      lastRotatedBy: rotatedBy ? rotatedBy.name || rotatedBy.email : null,
    }
  })
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request)
    if (!canManagePrivacyLockSettings(user)) {
      return NextResponse.json({ error: "Organization admin access required" }, { status: 403 })
    }

    return NextResponse.json({
      settings: await mapSafeStatus(org.id),
      permissions: {
        canManage: true,
      },
      notes: {
        settingsUrl: getPrivacyLocksAdminUrl(),
        offboarding:
          "When staff leave, rotate sensitive privacy PINs and force-lock active sessions before sharing the new PIN with authorised users.",
        sessionReset:
          "Global force sign-out is not fully supported in the current JWT session model. Use PIN rotation and force-lock to invalidate protected-module unlocks immediately.",
      },
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load privacy lock settings")
  }
}

const mutatePrivacyLock = async (request: Request) => {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await requireAdminRequest(request)
    if (!canManagePrivacyLockSettings(user)) {
      return NextResponse.json({ error: "Organization admin access required" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const module = body?.module === "hr" || body?.module === "accounting" ? (body.module as PrivacyModule) : null
    const action = String(body?.action || "").trim().toLowerCase()
    const pin = String(body?.pin || "")
    const confirmPin = String(body?.confirmPin || "")

    if (!module) {
      return NextResponse.json({ error: "Valid module is required" }, { status: 400 })
    }

    const current = await prisma.orgPrivacyLockSetting.findUnique({
      where: {
        orgId_module: {
          orgId: org.id,
          module,
        },
      },
      select: {
        id: true,
        pinVersion: true,
      },
    })

    if (action === "force-lock") {
      if (!current) {
        return NextResponse.json({ error: `${mapModuleLabel(module)} is not configured yet.` }, { status: 400 })
      }

      const updated = await prisma.orgPrivacyLockSetting.update({
        where: { id: current.id },
        data: {
          pinVersion: { increment: 1 },
          updatedByUserId: user.id,
        },
        select: { pinVersion: true },
      })

      await createAuditLog({
        orgId: org.id,
        userId: user.id,
        action: privacyLockAuditAction(module, "force-locked"),
        entity: "OrgPrivacyLockSetting",
        entityId: module,
        metadata: privacyLockAuditMetadata({ module, pinVersion: updated.pinVersion }),
      })

      return NextResponse.json({
        success: true,
        message: `${mapModuleLabel(module)} active unlock sessions were force-locked.`,
        settings: await mapSafeStatus(org.id),
      })
    }

    if (action !== "set" && action !== "rotate") {
      return NextResponse.json({ error: "Valid action is required" }, { status: 400 })
    }

    if (!pin || !confirmPin) {
      return NextResponse.json({ error: "PIN and confirmation are required" }, { status: 400 })
    }

    if (pin !== confirmPin) {
      return NextResponse.json({ error: "PIN confirmation does not match" }, { status: 400 })
    }

    const validationError = validatePrivacyPin(pin)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const hashed = hashPrivacyPin(pin)
    const nextVersion = current ? current.pinVersion + 1 : 1

    await prisma.orgPrivacyLockSetting.upsert({
      where: {
        orgId_module: {
          orgId: org.id,
          module,
        },
      },
      update: {
        pinHash: hashed,
        pinVersion: { increment: current ? 1 : 0 },
        updatedByUserId: user.id,
        lastRotatedAt: new Date(),
        lastRotatedByUserId: user.id,
      },
      create: {
        orgId: org.id,
        module,
        pinHash: hashed,
        pinVersion: 1,
        updatedByUserId: user.id,
        lastRotatedAt: new Date(),
        lastRotatedByUserId: user.id,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: privacyLockAuditAction(module, current ? "rotated" : "set"),
      entity: "OrgPrivacyLockSetting",
      entityId: module,
      metadata: privacyLockAuditMetadata({ module, pinVersion: nextVersion }),
    })

    return NextResponse.json({
      success: true,
      message: current
        ? `${mapModuleLabel(module)} rotated. Existing unlocked sessions are now locked again.`
        : `${mapModuleLabel(module)} configured.`,
      settings: await mapSafeStatus(org.id),
    })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update privacy lock settings")
  }
}

export async function POST(request: Request) {
  return mutatePrivacyLock(request)
}

export async function PATCH(request: Request) {
  return mutatePrivacyLock(request)
}
