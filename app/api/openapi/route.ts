import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"

export async function GET() {
  try {
    const openapiPath = path.join(process.cwd(), "docs", "security", "openapi.yaml")
    const spec = await readFile(openapiPath, "utf8")
    return new NextResponse(spec, {
      status: 200,
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("OpenAPI spec read failed", error)
    return NextResponse.json({ error: "OpenAPI spec not found" }, { status: 404 })
  }
}
