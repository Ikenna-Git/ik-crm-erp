import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable inventory stock." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "inventory", "view")
    const stock = await prisma.inventoryStock.findMany({
      where: { orgId: org.id },
      orderBy: [{ updatedAt: "desc" }, { sku: "asc" }],
    })
    return NextResponse.json({ stock })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load inventory stock")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "inventory", "manage")
    const body = await request.json()
    const items = Array.isArray(body) ? body : [body]
    if (!items.length) {
      return NextResponse.json({ error: "payload required" }, { status: 400 })
    }

    const created = []
    for (const item of items) {
      if (!item?.sku || !item?.name) continue
      const stock = await prisma.inventoryStock.upsert({
        where: { orgId_sku: { orgId: org.id, sku: String(item.sku).trim() } },
        update: {
          name: String(item.name).trim(),
          currentStock: Number(item.currentStock || 0),
          reorderPoint: Number(item.reorderPoint || 0),
          reorderQuantity: Number(item.reorderQuantity || 0),
          warehouseLocation: item.warehouseLocation ? String(item.warehouseLocation).trim() : "A-0-0",
          status: item.status ? String(item.status).trim().toLowerCase() : "ok",
        },
        create: {
          orgId: org.id,
          sku: String(item.sku).trim(),
          name: String(item.name).trim(),
          currentStock: Number(item.currentStock || 0),
          reorderPoint: Number(item.reorderPoint || 0),
          reorderQuantity: Number(item.reorderQuantity || 0),
          warehouseLocation: item.warehouseLocation ? String(item.warehouseLocation).trim() : "A-0-0",
          status: item.status ? String(item.status).trim().toLowerCase() : "ok",
        },
      })
      created.push(stock)
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: items.length > 1 ? "Imported inventory stock" : "Created inventory stock",
      entity: "InventoryStock",
      metadata: { count: created.length },
    })

    return NextResponse.json({ stock: created })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to save inventory stock")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "inventory", "manage")
    const body = await request.json()
    const { id, sku, name, currentStock, reorderPoint, reorderQuantity, warehouseLocation, status } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingStock = await prisma.inventoryStock.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingStock) {
      return NextResponse.json({ error: "Inventory stock not found" }, { status: 404 })
    }

    const stock = await prisma.inventoryStock.update({
      where: { id },
      data: {
        sku: sku !== undefined ? String(sku).trim() : undefined,
        name: name !== undefined ? String(name).trim() : undefined,
        currentStock: currentStock !== undefined ? Number(currentStock || 0) : undefined,
        reorderPoint: reorderPoint !== undefined ? Number(reorderPoint || 0) : undefined,
        reorderQuantity: reorderQuantity !== undefined ? Number(reorderQuantity || 0) : undefined,
        warehouseLocation: warehouseLocation !== undefined ? String(warehouseLocation).trim() : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated inventory stock",
      entity: "InventoryStock",
      entityId: stock.id,
      metadata: { sku: stock.sku, name: stock.name },
    })

    return NextResponse.json({ stock })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update inventory stock")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "inventory", "manage")
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingStock = await prisma.inventoryStock.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingStock) {
      return NextResponse.json({ error: "Inventory stock not found" }, { status: 404 })
    }

    const stock = await prisma.inventoryStock.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted inventory stock",
      entity: "InventoryStock",
      entityId: stock.id,
      metadata: { sku: stock.sku, name: stock.name },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete inventory stock")
  }
}
