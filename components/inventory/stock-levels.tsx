"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MoreHorizontal, Eye, Edit, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/shared/pagination-controls"
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

const stockNames = ['Laptop Pro 15"', "Wireless Mouse", "USB-C Cable", 'Monitor 4K 27"', "Ergo Keyboard", "Desk Lamp"]
const stockStatuses: StockItem["status"][] = ["ok", "low", "critical"]

const buildMockStock = (count: number): StockItem[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `STK-${(idx + 1).toString().padStart(3, "0")}`,
    sku: `PROD-${(idx + 1).toString().padStart(4, "0")}`,
    name: stockNames[idx % stockNames.length],
    currentStock: 5 + (idx % 20) * 4,
    reorderPoint: 10 + (idx % 5) * 5,
    reorderQuantity: 15 + (idx % 6) * 10,
    warehouseLocation: `A-${(idx % 15) + 1}-${(idx % 6) + 1}`,
    status: stockStatuses[idx % stockStatuses.length],
  }))

const mockStockLevels: StockItem[] = buildMockStock(70)

const STORAGE_KEY = "civis_inventory_stock_levels"
const IMPORT_EVENT = "civis-inventory-import"

const statusConfig = {
  ok: { badge: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200", icon: "✓" },
  low: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200", icon: "!" },
  critical: { badge: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200", icon: "!" },
}

export function StockLevels({ searchQuery }: { searchQuery: string }) {
  const [items, setItems] = useState<StockItem[]>(mockStockLevels)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
          const merged = [
            ...parsed,
            ...mockStockLevels.filter((seed) => !parsed.some((item: StockItem) => item.id === seed.id)),
          ]
          setItems(merged)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
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

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

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
                {pagedItems.map((item) => {
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
