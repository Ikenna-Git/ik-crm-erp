"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface StockItem {
  id: string
  sku: string
  name: string
  currentStock: number
  reorderPoint: number
  reorderQuantity: number
  warehouseLocation: string
  status: "ok" | "low" | "critical"
}

const mockStockLevels: StockItem[] = [
  {
    id: "1",
    sku: "PROD-001",
    name: 'Laptop Pro 15"',
    currentStock: 45,
    reorderPoint: 10,
    reorderQuantity: 20,
    warehouseLocation: "A-12-5",
    status: "ok",
  },
  {
    id: "2",
    sku: "PROD-002",
    name: "Wireless Mouse",
    currentStock: 8,
    reorderPoint: 15,
    reorderQuantity: 50,
    warehouseLocation: "B-5-2",
    status: "critical",
  },
  {
    id: "3",
    sku: "PROD-003",
    name: "USB-C Cable",
    currentStock: 120,
    reorderPoint: 50,
    reorderQuantity: 200,
    warehouseLocation: "C-8-1",
    status: "ok",
  },
  {
    id: "4",
    sku: "PROD-004",
    name: 'Monitor 4K 27"',
    currentStock: 12,
    reorderPoint: 10,
    reorderQuantity: 15,
    warehouseLocation: "A-15-3",
    status: "low",
  },
]

const STORAGE_KEY = "civis_inventory_stock_levels"
const IMPORT_EVENT = "civis-inventory-import"

const statusConfig = {
  ok: { badge: "bg-green-100 text-green-800", icon: "✓" },
  low: { badge: "bg-yellow-100 text-yellow-800", icon: "!" },
  critical: { badge: "bg-red-100 text-red-800", icon: "!" },
}

export function StockLevels({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<StockItem[]>(mockStockLevels)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    sku: "",
    name: "",
    currentStock: "",
    reorderPoint: "",
    reorderQuantity: "",
    warehouseLocation: "",
    status: "ok" as StockItem["status"],
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockStockLevels))
    } catch (err) {
      console.warn("Failed to load stock levels", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ type?: string; items?: StockItem[] }>
      if (custom.detail?.type === "stock" && Array.isArray(custom.detail.items)) {
        setItems(custom.detail.items)
      }
    }
    window.addEventListener(IMPORT_EVENT, handler)
    return () => window.removeEventListener(IMPORT_EVENT, handler)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.warn("Failed to persist stock levels", err)
    }
  }, [items])

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    ok: filteredItems.filter((i) => i.status === "ok").length,
    low: filteredItems.filter((i) => i.status === "low").length,
    critical: filteredItems.filter((i) => i.status === "critical").length,
  }

  const openEditor = (item?: StockItem) => {
    if (item) {
      setEditingId(item.id)
      setForm({
        sku: item.sku,
        name: item.name,
        currentStock: String(item.currentStock),
        reorderPoint: String(item.reorderPoint),
        reorderQuantity: String(item.reorderQuantity),
        warehouseLocation: item.warehouseLocation,
        status: item.status,
      })
    } else {
      setEditingId(null)
      setForm({
        sku: "",
        name: "",
        currentStock: "",
        reorderPoint: "",
        reorderQuantity: "",
        warehouseLocation: "",
        status: "ok",
      })
    }
    setShowModal(true)
  }

  const saveItem = () => {
    const payload: StockItem = {
      id: editingId || Date.now().toString(),
      sku: form.sku || "PROD-NEW",
      name: form.name || "New Item",
      currentStock: Number(form.currentStock || 0),
      reorderPoint: Number(form.reorderPoint || 0),
      reorderQuantity: Number(form.reorderQuantity || 0),
      warehouseLocation: form.warehouseLocation || "A-0-0",
      status: form.status,
    }
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? payload : i)))
    } else {
      setItems((prev) => [payload, ...prev])
    }
    setShowModal(false)
    setEditingId(null)
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Optimal Stock</p>
            <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Critical</p>
            <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels ({filteredItems.length})</CardTitle>
          <CardDescription>Real-time inventory positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Current Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reorder Point</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const stockPercentage = (item.currentStock / (item.reorderPoint * 3)) * 100
                  return (
                    <tr key={item.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <p className="font-semibold">{item.currentStock} units</p>
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">{item.reorderPoint} units</td>
                      <td className="py-4 px-4 text-muted-foreground">{item.warehouseLocation}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={statusConfig[item.status].badge}>
                          {item.status === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {item.status}
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
                            <DropdownMenuItem onClick={() => alert(JSON.stringify(item, null, 2))}>
                              <Eye className="w-4 h-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditor(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>{editingId ? "Edit Stock Item" : "Add Stock Item"}</CardTitle>
                <CardDescription>Update levels, reorder points, and location.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Product Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Stock</Label>
                  <Input
                    type="number"
                    value={form.currentStock}
                    onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Reorder Point</Label>
                  <Input
                    type="number"
                    value={form.reorderPoint}
                    onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Reorder Quantity</Label>
                  <Input
                    type="number"
                    value={form.reorderQuantity}
                    onChange={(e) => setForm({ ...form, reorderQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Warehouse Location</Label>
                  <Input
                    value={form.warehouseLocation}
                    onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as StockItem["status"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="ok">OK</option>
                    <option value="low">Low</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveItem}>{editingId ? "Save changes" : "Add item"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
