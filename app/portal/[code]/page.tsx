import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import PortalClient from "./portal-client"

export default async function PortalView({ params }: { params: { code: string } }) {
  if (!params?.code) {
    notFound()
  }
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

  const portalData = {
    id: portal.id,
    name: portal.name,
    status: portal.status,
    summary: portal.summary,
    contactName: portal.contactName,
    contactEmail: portal.contactEmail,
    accessCode: portal.accessCode,
    updatedAt: portal.updatedAt.toISOString(),
    updates: portal.updates.map((update) => ({
      id: update.id,
      title: update.title,
      message: update.message,
      status: update.status,
      createdAt: update.createdAt.toISOString(),
    })),
    documents: portal.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      url: doc.url,
      fileType: doc.fileType,
      createdAt: doc.createdAt.toISOString(),
    })),
  }

  return <PortalClient portal={portalData} />
}
