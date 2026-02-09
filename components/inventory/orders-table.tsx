"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Trash2, Truck, MoreHorizontal, Edit, X, CheckSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { addApprovalRequest } from "@/lib/approvals"

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
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-700/40 dark:text-slate-200",
  ordered: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  "in-transit": "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200",
}

const orderSuppliers = ["TechGear Inc", "PeripheralCo", "CableMaster", "DisplayTech", "OfficeWorks", "Nimbus Supply"]
const orderStatuses: PurchaseOrder["status"][] = ["draft", "ordered", "in-transit", "delivered", "cancelled"]

const buildMockOrders = (count: number): PurchaseOrder[] =>
  Array.from({ length: count }, (_, idx) => {
    const orderDate = new Date(2025, (idx % 12), (idx % 27) + 1).toISOString().slice(0, 10)
    const expectedDelivery = new Date(2025, (idx % 12), (idx % 27) + 6).toISOString().slice(0, 10)
    return {
      id: `PO-${(idx + 1).toString().padStart(3, "0")}`,
      orderNo: `PO-2025-${(idx + 1).toString().padStart(3, "0")}`,
      supplier: orderSuppliers[idx % orderSuppliers.length],
      items: 10 + (idx % 12) * 5,
      totalValue: 2500 + (idx % 10) * 1800,
      orderDate,
      expectedDelivery,
      status: orderStatuses[idx % orderStatuses.length],
    }
  })

const mockOrders: PurchaseOrder[] = buildMockOrders(70)

const STORAGE_KEY = "civis_inventory_orders"
const IMPORT_EVENT = "civis-inventory-import"

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export function OrdersTable({ searchQuery }: { searchQuery: string }) {
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockOrders)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    orderNo: "",
    supplier: "",
    items: "",
    totalValue: "",
    expectedDelivery: "",
    status: "draft" as PurchaseOrder["status"],
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const merged = [
            ...parsed,
            ...mockOrders.filter((seed) => !parsed.some((item: PurchaseOrder) => item.id === seed.id)),
          ]
          setOrders(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockOrders))
    } catch (err) {
      console.warn("Failed to load orders", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ type?: string; items?: PurchaseOrder[] }>
      if (custom.detail?.type === "orders" && Array.isArray(custom.detail.items)) {
        setOrders(custom.detail.items)
      }
    }
    window.addEventListener(IMPORT_EVENT, handler)
    return () => window.removeEventListener(IMPORT_EVENT, handler)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch (err) {
      console.warn("Failed to persist orders", err)
    }
  }, [orders])

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
  const pagedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const stats = {
    pending: filteredOrders.filter((o) => o.status === "ordered" || o.status === "draft").length,
    intransit: filteredOrders.filter((o) => o.status === "in-transit").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
  }

  const openEditor = (order?: PurchaseOrder) => {
    if (order) {
      setEditingId(order.id)
      setForm({
        orderNo: order.orderNo,
        supplier: order.supplier,
        items: String(order.items),
        totalValue: String(order.totalValue),
        expectedDelivery: order.expectedDelivery,
        status: order.status,
      })
    } else {
      setEditingId(null)
      setForm({
        orderNo: "",
        supplier: "",
        items: "",
        totalValue: "",
        expectedDelivery: "",
        status: "draft",
      })
    }
    setShowModal(true)
  }

  const saveOrder = () => {
    const payload: PurchaseOrder = {
      id: editingId || Date.now().toString(),
      orderNo: form.orderNo || `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      supplier: form.supplier || "Supplier",
      items: Number(form.items || 0),
      totalValue: Number(form.totalValue || 0),
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDelivery: form.expectedDelivery || new Date().toISOString().slice(0, 10),
      status: form.status,
    }
    if (editingId) {
      setOrders((prev) => prev.map((o) => (o.id === editingId ? payload : o)))
    } else {
      setOrders((prev) => [payload, ...prev])
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  const requestApproval = (order: PurchaseOrder) => {
    addApprovalRequest({
      request: `Purchase order ${order.orderNo}`,
      owner: "Procurement",
      amount: formatNaira(order.totalValue),
      module: "Inventory",
    })
    alert("Approval requested. Review it in Operations → Approvals.")
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
                {pagedOrders.map((order) => (
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
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(order, null, 2))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditor(order)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => requestApproval(order)}>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Request approval
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteOrder(order.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pt-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>{editingId ? "Edit Purchase Order" : "Add Purchase Order"}</CardTitle>
                <CardDescription>Update supplier orders and delivery details.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order No</Label>
                  <Input value={form.orderNo} onChange={(e) => setForm({ ...form, orderNo: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Supplier</Label>
                  <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Items</Label>
                  <Input
                    type="number"
                    value={form.items}
                    onChange={(e) => setForm({ ...form, items: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Value</Label>
                  <Input
                    type="number"
                    value={form.totalValue}
                    onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Expected Delivery</Label>
                  <Input
                    type="date"
                    value={form.expectedDelivery}
                    onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as PurchaseOrder["status"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="draft">Draft</option>
                    <option value="ordered">Ordered</option>
                    <option value="in-transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveOrder}>{editingId ? "Save changes" : "Add order"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
