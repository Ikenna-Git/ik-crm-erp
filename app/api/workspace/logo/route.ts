import { NextResponse } from "next/server"
import crypto from "crypto"

import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { getWorkspaceIdentityPermissions } from "@/lib/workspace-context"

const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const
const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp"]
const maxLogoBytes = 3 * 1024 * 1024

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable company identity." }, { status: 503 })

const missingCloudinary = () =>
  NextResponse.json(
    { error: "Logo upload requires Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET." },
    { status: 500 },
  )

const deleteCloudinaryAsset = async (publicId?: string | null) => {
  if (!publicId) return
  if (required.some((key) => !process.env[key])) return

  const timestamp = Math.floor(Date.now() / 1000)
  const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex")
  const body = new URLSearchParams()
  body.set("public_id", publicId)
  body.set("timestamp", String(timestamp))
  body.set("api_key", process.env.CLOUDINARY_API_KEY || "")
  body.set("signature", signature)

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body,
  }).catch(() => null)
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    const permissions = getWorkspaceIdentityPermissions({ role: user.role, email: user.email })
    if (!permissions.canManageIdentity) {
      return NextResponse.json({ error: "You do not have permission to update company identity." }, { status: 403 })
    }

    const missing = required.filter((key) => !process.env[key])
    if (missing.length) return missingCloudinary()

    const formData = await request.formData()
    const file = formData.get("file")
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Logo file is required." }, { status: 400 })
    }

    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Upload a PNG, JPG, JPEG, or WEBP logo only." }, { status: 415 })
    }

    if (file.size > maxLogoBytes) {
      return NextResponse.json({ error: "Logo file is too large. Max allowed size is 3MB." }, { status: 413 })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = `civis/workspaces/${org.id}/branding`
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex")

    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("api_key", process.env.CLOUDINARY_API_KEY || "")
    uploadData.append("timestamp", String(timestamp))
    uploadData.append("signature", signature)
    uploadData.append("folder", folder)

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: uploadData,
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Logo upload failed" }, { status: 500 })
    }

    const previousPublicId = org.logoPublicId
    const updated = await prisma.org.update({
      where: { id: org.id },
      data: {
        logoUrl: data.secure_url || null,
        logoPublicId: data.public_id || null,
      },
    })

    if (previousPublicId && previousPublicId !== updated.logoPublicId) {
      await deleteCloudinaryAsset(previousPublicId)
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "workspace.logo.updated",
      entity: "Org",
      entityId: org.id,
      metadata: {
        logoUrl: updated.logoUrl,
        logoPublicId: updated.logoPublicId,
      },
    })

    return NextResponse.json({
      message: "Company logo uploaded.",
      logoUrl: updated.logoUrl,
      logoPublicId: updated.logoPublicId,
    })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Workspace logo upload failed", error)
    return NextResponse.json({ error: "Failed to upload company logo" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    const permissions = getWorkspaceIdentityPermissions({ role: user.role, email: user.email })
    if (!permissions.canManageIdentity) {
      return NextResponse.json({ error: "You do not have permission to update company identity." }, { status: 403 })
    }

    const previousPublicId = org.logoPublicId
    await prisma.org.update({
      where: { id: org.id },
      data: {
        logoUrl: null,
        logoPublicId: null,
      },
    })

    await deleteCloudinaryAsset(previousPublicId)

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "workspace.logo.removed",
      entity: "Org",
      entityId: org.id,
      metadata: { removed: true },
    })

    return NextResponse.json({ message: "Company logo removed." })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Workspace logo removal failed", error)
    return NextResponse.json({ error: "Failed to remove company logo" }, { status: 500 })
  }
}
