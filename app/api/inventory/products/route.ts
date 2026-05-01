import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { handleAccessRouteError, requireModuleAccess } from "@/lib/access-route"
import { seedInventoryData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable inventory products." }, { status: 503 })

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await requireModuleAccess(request, "inventory", "view")
    await seedInventoryData(org.id)
    const products = await prisma.inventoryProduct.findMany({
      where: { orgId: org.id },
      orderBy: [{ createdAt: "desc" }, { sku: "asc" }],
    })
    return NextResponse.json({ products })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to load inventory products")
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
      const product = await prisma.inventoryProduct.upsert({
        where: { orgId_sku: { orgId: org.id, sku: String(item.sku).trim() } },
        update: {
          name: String(item.name).trim(),
          category: item.category ? String(item.category).trim() : "General",
          price: Number(item.price || 0),
          cost: Number(item.cost || 0),
          supplier: item.supplier ? String(item.supplier).trim() : "Supplier",
          status: item.status ? String(item.status).trim().toLowerCase() : "active",
        },
        create: {
          orgId: org.id,
          sku: String(item.sku).trim(),
          name: String(item.name).trim(),
          category: item.category ? String(item.category).trim() : "General",
          price: Number(item.price || 0),
          cost: Number(item.cost || 0),
          supplier: item.supplier ? String(item.supplier).trim() : "Supplier",
          status: item.status ? String(item.status).trim().toLowerCase() : "active",
        },
      })
      created.push(product)
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: items.length > 1 ? "Imported inventory products" : "Created inventory product",
      entity: "InventoryProduct",
      metadata: { count: created.length },
    })

    return NextResponse.json({ products: created })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to save inventory products")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await requireModuleAccess(request, "inventory", "manage")
    const body = await request.json()
    const { id, sku, name, category, price, cost, supplier, status } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingProduct = await prisma.inventoryProduct.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: "Inventory product not found" }, { status: 404 })
    }

    const product = await prisma.inventoryProduct.update({
      where: { id },
      data: {
        sku: sku !== undefined ? String(sku).trim() : undefined,
        name: name !== undefined ? String(name).trim() : undefined,
        category: category !== undefined ? String(category).trim() : undefined,
        price: price !== undefined ? Number(price || 0) : undefined,
        cost: cost !== undefined ? Number(cost || 0) : undefined,
        supplier: supplier !== undefined ? String(supplier).trim() : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated inventory product",
      entity: "InventoryProduct",
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name },
    })

    return NextResponse.json({ product })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to update inventory product")
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

    const existingProduct = await prisma.inventoryProduct.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingProduct) {
      return NextResponse.json({ error: "Inventory product not found" }, { status: 404 })
    }

    const product = await prisma.inventoryProduct.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted inventory product",
      entity: "InventoryProduct",
      entityId: product.id,
      metadata: { sku: product.sku, name: product.name },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleAccessRouteError(error, "Failed to delete inventory product")
  }
}
