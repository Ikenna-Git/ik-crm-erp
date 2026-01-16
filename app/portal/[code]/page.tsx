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

  const portal = await prisma.clientPortal.findUnique({
    where: { accessCode: params.code },
    include: {
      updates: { orderBy: { createdAt: "desc" }, take: 12 },
      documents: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  })
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

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Updates timeline</h2>
          {portal.updates.length ? (
            <div className="space-y-4">
              {portal.updates.map((update) => (
                <div key={update.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{update.title}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(update.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {update.message ? <p className="text-sm text-muted-foreground mt-1">{update.message}</p> : null}
                  {update.status ? (
                    <p className="text-xs text-muted-foreground mt-2">Status: {update.status}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No updates posted yet.</p>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Shared documents</h2>
          {portal.documents.length ? (
            <div className="space-y-2">
              {portal.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm hover:bg-muted/50 transition"
                >
                  <span className="font-medium">{doc.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {doc.fileType || "file"} • {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents shared yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
