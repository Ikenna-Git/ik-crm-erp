import { NextResponse } from "next/server"
import crypto from "crypto"

const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"] as const

const missingCloudinary = () =>
  NextResponse.json(
    { error: "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET." },
    { status: 500 },
  )

export async function POST(request: Request) {
  const missing = required.filter((key) => !process.env[key])
  if (missing.length) return missingCloudinary()

  const formData = await request.formData()
  const file = formData.get("file")
  const folder = formData.get("folder")?.toString() || "civis"

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "File is required" }, { status: 400 })
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
}
