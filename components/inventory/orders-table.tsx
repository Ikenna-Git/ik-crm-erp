"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Truck } from "lucide-react"

interface PurchaseOrder {
  id: string
  orderNo: string
  supplier: string
  items: number
  totalValue: number
  orderDate: string
  expectedDelivery: string
  status: "draft" | "ordered" | "in-transit" | "delivered" | "cancelled"
}

const statusColors = {
  draft: "bg-slate-100 text-slate-800",
  ordered: "bg-blue-100 text-blue-800",
  "in-transit": "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const mockOrders: PurchaseOrder[] = [
  {
    id: "1",
    orderNo: "PO-2025-001",
    supplier: "TechGear Inc",
    items: 50,
    totalValue: 32500,
    orderDate: "2025-01-10",
    expectedDelivery: "2025-02-05",
    status: "delivered",
  },
  {
    id: "2",
    orderNo: "PO-2025-002",
    supplier: "PeripheralCo",
    items: 200,
    totalValue: 4800,
    orderDate: "2025-01-18",
    expectedDelivery: "2025-02-08",
    status: "in-transit",
  },
  {
    id: "3",
    orderNo: "PO-2025-003",
    supplier: "CableMaster",
    items: 500,
    totalValue: 2500,
    orderDate: "2025-01-22",
    expectedDelivery: "2025-02-15",
    status: "ordered",
  },
  {
    id: "4",
    orderNo: "PO-2025-004",
    supplier: "DisplayTech",
    items: 15,
    totalValue: 3750,
    orderDate: "2025-01-25",
    expectedDelivery: "2025-02-20",
    status: "draft",
  },
]

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export function OrdersTable({ searchQuery }: { searchQuery: string }) {
  const filteredOrders = mockOrders.filter(
    (order) =>
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    pending: filteredOrders.filter((o) => o.status === "ordered" || o.status === "draft").length,
    intransit: filteredOrders.filter((o) => o.status === "in-transit").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
  }

  return (
    <div className="space-y-4">
      {/* Order Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">In Transit</p>
            <p className="text-2xl font-bold text-accent">{stats.intransit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>Manage inventory orders and suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Total Value</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Expected Delivery</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4 font-medium">{order.orderNo}</td>
                    <td className="py-4 px-4">{order.supplier}</td>
                    <td className="py-4 px-4">{order.items}</td>
                    <td className="py-4 px-4 font-semibold">{formatNaira(order.totalValue)}</td>
                    <td className="py-4 px-4 text-muted-foreground">{order.expectedDelivery}</td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className={statusColors[order.status]}>
                        {order.status === "in-transit" && <Truck className="w-3 h-3 mr-1" />}
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
