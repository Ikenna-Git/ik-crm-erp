"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

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

const statusConfig = {
  ok: { badge: "bg-green-100 text-green-800", icon: "✓" },
  low: { badge: "bg-yellow-100 text-yellow-800", icon: "!" },
  critical: { badge: "bg-red-100 text-red-800", icon: "!" },
}

export function StockLevels({ searchQuery }: { searchQuery: string }) {
  const filteredItems = mockStockLevels.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const stats = {
    ok: filteredItems.filter((i) => i.status === "ok").length,
    low: filteredItems.filter((i) => i.status === "low").length,
    critical: filteredItems.filter((i) => i.status === "critical").length,
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
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
