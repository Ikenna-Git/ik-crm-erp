import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type AuditInput = {
  orgId: string
  userId?: string | null
  action: string
  entity?: string | null
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

export const createAuditLog = async ({ orgId, userId, action, entity, entityId, metadata }: AuditInput) => {
  try {
    return await prisma.auditLog.create({
      data: {
        orgId,
        userId: userId || null,
        action,
        entity: entity || null,
        entityId: entityId || null,
        metadata: (metadata as Prisma.InputJsonValue | undefined) ?? undefined,
      },
    })
  } catch (error) {
    console.error("Audit log create failed", error)
    return null
  }
}
