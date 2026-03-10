import { POST as legacyRollbackPost } from "@/app/api/decision-trails/rollback/route"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}))
  const payload = { ...(body as Record<string, unknown>), id: params.id }
  const headers = new Headers(request.headers)
  headers.set("content-type", "application/json")

  const proxiedRequest = new Request(request.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  return legacyRollbackPost(proxiedRequest)
}
