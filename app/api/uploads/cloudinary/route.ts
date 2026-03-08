import { NextResponse } from "next/server"
import crypto from "crypto"
import { getSessionIdentityFromRequest, isRequestUserError } from "@/lib/request-user"
import { getRateLimitKey, rateLimit, retryAfterSeconds } from "@/lib/rate-limit"

const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const
const allowedMimePrefixes = ["image/", "video/", "application/pdf"]
const maxUploadBytes = Number(process.env.MAX_UPLOAD_BYTES || 20 * 1024 * 1024)

const missingCloudinary = () =>
  NextResponse.json(
    { error: "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." },
    { status: 500 },
  )

const normalizeFolder = (value: string) => {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
  return cleaned || "civis"
}

export async function POST(request: Request) {
  try {
    await getSessionIdentityFromRequest(request)

    const limit = rateLimit(getRateLimitKey(request, "cloudinary-upload"), { limit: 40, windowMs: 60_000 })
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait a minute and try again." },
        { status: 429, headers: { "Retry-After": retryAfterSeconds(limit.resetAt).toString() } },
      )
    }

    const missing = required.filter((key) => !process.env[key])
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = normalizeFolder(formData.get("folder")?.toString() || "civis")

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    if (!allowedMimePrefixes.some((prefix) => file.type.startsWith(prefix))) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload images, videos, or PDF documents only." },
        { status: 415 },
      )
    }

    if (file.size > maxUploadBytes) {
      return NextResponse.json({ error: `File too large. Max allowed is ${maxUploadBytes} bytes.` }, { status: 413 })
    }

    if (missing.length) {
      if (process.env.NODE_ENV !== "production") {
        const buffer = Buffer.from(await file.arrayBuffer())
        const mime = file.type || "application/octet-stream"
        const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`
        return NextResponse.json({
          url: dataUrl,
          bytes: buffer.length,
          resourceType: mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : "raw",
          originalFilename: file.name,
          mocked: true,
        })
      }
      return missingCloudinary()
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const signatureBase = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`
    const signature = crypto.createHash("sha1").update(signatureBase).digest("hex")

    const uploadData = new FormData()
    uploadData.append("file", file)
    uploadData.append("api_key", process.env.CLOUDINARY_API_KEY || "")
    uploadData.append("timestamp", timestamp.toString())
    uploadData.append("signature", signature)
    uploadData.append("folder", folder)

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
    const response = await fetch(uploadUrl, { method: "POST", body: uploadData })
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || "Upload failed" }, { status: 500 })
    }

    return NextResponse.json({
      url: data.secure_url,
      bytes: data.bytes,
      resourceType: data.resource_type,
      originalFilename: data.original_filename,
    })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Cloudinary upload failed", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
