import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

export default async function PortalView({ params }: { params: { code: string } }) {
  if (!process.env.DATABASE_URL) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Client portal is currently unavailable.
      </div>
    )
  }

  const portal = await prisma.clientPortal.findUnique({ where: { accessCode: params.code } })
  if (!portal) notFound()

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Civis Client Portal</p>
          <h1 className="text-3xl font-bold">{portal.name}</h1>
          <p className="text-muted-foreground">
            Status: <span className="font-semibold">{portal.status}</span>
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Latest summary</h2>
          <p className="text-sm text-muted-foreground">
            {portal.summary || "No summary posted yet. Check back soon for updates."}
          </p>
          <p className="text-xs text-muted-foreground">
            Updated {portal.updatedAt.toLocaleDateString()} • Contact {portal.contactName || "your Civis team"}
          </p>
        </div>
      </div>
    </div>
  )
}
