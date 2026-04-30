import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { seedInventoryData } from "@/lib/module-seeds"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable purchase orders." }, { status: 503 })

const handleError = (error: unknown, fallback: string) => {
  console.error(fallback, error)
  if (isRequestUserError(error)) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: fallback }, { status: 500 })
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org } = await getUserFromRequest(request)
    await seedInventoryData(org.id)
    const orders = await prisma.purchaseOrder.findMany({
      where: { orgId: org.id },
      orderBy: [{ orderDate: "desc" }, { createdAt: "desc" }],
    })
    return NextResponse.json({ orders })
  } catch (error) {
    return handleError(error, "Failed to load purchase orders")
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const items = Array.isArray(body) ? body : [body]
    if (!items.length) {
      return NextResponse.json({ error: "payload required" }, { status: 400 })
    }

    const created = []
    for (const item of items) {
      if (!item?.orderNo || !item?.supplier) continue
      const order = await prisma.purchaseOrder.upsert({
        where: { orgId_orderNo: { orgId: org.id, orderNo: String(item.orderNo).trim() } },
        update: {
          supplier: String(item.supplier).trim(),
          items: Number(item.items || 0),
          totalValue: Number(item.totalValue || 0),
          orderDate: item.orderDate ? new Date(item.orderDate) : new Date(),
          expectedDelivery: item.expectedDelivery ? new Date(item.expectedDelivery) : new Date(),
          status: item.status ? String(item.status).trim().toLowerCase() : "draft",
        },
        create: {
          orgId: org.id,
          orderNo: String(item.orderNo).trim(),
          supplier: String(item.supplier).trim(),
          items: Number(item.items || 0),
          totalValue: Number(item.totalValue || 0),
          orderDate: item.orderDate ? new Date(item.orderDate) : new Date(),
          expectedDelivery: item.expectedDelivery ? new Date(item.expectedDelivery) : new Date(),
          status: item.status ? String(item.status).trim().toLowerCase() : "draft",
        },
      })
      created.push(order)
    }

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: items.length > 1 ? "Imported purchase orders" : "Created purchase order",
      entity: "PurchaseOrder",
      metadata: { count: created.length },
    })

    return NextResponse.json({ orders: created })
  } catch (error) {
    return handleError(error, "Failed to save purchase orders")
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const body = await request.json()
    const { id, orderNo, supplier, items, totalValue, orderDate, expectedDelivery, status } = body || {}
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        orderNo: orderNo !== undefined ? String(orderNo).trim() : undefined,
        supplier: supplier !== undefined ? String(supplier).trim() : undefined,
        items: items !== undefined ? Number(items || 0) : undefined,
        totalValue: totalValue !== undefined ? Number(totalValue || 0) : undefined,
        orderDate: orderDate !== undefined ? (orderDate ? new Date(orderDate) : null) : undefined,
        expectedDelivery: expectedDelivery !== undefined ? (expectedDelivery ? new Date(expectedDelivery) : null) : undefined,
        status: status !== undefined ? String(status).trim().toLowerCase() : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Updated purchase order",
      entity: "PurchaseOrder",
      entityId: order.id,
      metadata: { orderNo: order.orderNo, supplier: order.supplier },
    })

    return NextResponse.json({ order })
  } catch (error) {
    return handleError(error, "Failed to update purchase order")
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()
  try {
    const { org, user } = await getUserFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const existingOrder = await prisma.purchaseOrder.findFirst({
      where: { id, orgId: org.id },
    })
    if (!existingOrder) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 })
    }

    const order = await prisma.purchaseOrder.delete({ where: { id } })
    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "Deleted purchase order",
      entity: "PurchaseOrder",
      entityId: order.id,
      metadata: { orderNo: order.orderNo, supplier: order.supplier },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleError(error, "Failed to delete purchase order")
  }
}
