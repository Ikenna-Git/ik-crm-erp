"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductsTable, type Product } from "@/components/inventory/products-table"
import { StockLevels, type StockItem } from "@/components/inventory/stock-levels"
import { OrdersTable, type PurchaseOrder } from "@/components/inventory/orders-table"

const toDateString = (value?: string | null) => (value ? String(value).slice(0, 10) : new Date().toISOString().slice(0, 10))

const requestJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || "Request failed")
  }
  return data
}

const mapProduct = (product: any): Product => ({
  id: product.id,
  sku: product.sku,
  name: product.name,
  category: product.category,
  price: Number(product.price || 0),
  cost: Number(product.cost || 0),
  supplier: product.supplier,
  status: ["active", "inactive", "discontinued"].includes(product.status) ? product.status : "active",
})

const mapStock = (item: any): StockItem => ({
  id: item.id,
  sku: item.sku,
  name: item.name,
  currentStock: Number(item.currentStock || 0),
  reorderPoint: Number(item.reorderPoint || 0),
  reorderQuantity: Number(item.reorderQuantity || 0),
  warehouseLocation: item.warehouseLocation,
  status: ["ok", "low", "critical"].includes(item.status) ? item.status : "ok",
})

const mapOrder = (order: any): PurchaseOrder => ({
  id: order.id,
  orderNo: order.orderNo,
  supplier: order.supplier,
  items: Number(order.items || 0),
  totalValue: Number(order.totalValue || 0),
  orderDate: toDateString(order.orderDate || order.createdAt),
  expectedDelivery: toDateString(order.expectedDelivery),
  status: ["draft", "ordered", "in-transit", "delivered", "cancelled"].includes(order.status)
    ? order.status
    : "draft",
})

export default function InventoryPage() {
  const searchQuery = ""
  const [activeTab, setActiveTab] = useState("products")
  const [products, setProducts] = useState<Product[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [openProductDialog, setOpenProductDialog] = useState(false)
  const [importNotice, setImportNotice] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    category: "",
  })

  const loadData = async () => {
    setLoading(true)
    setError("")
    try {
      const [productsRes, stockRes, ordersRes] = await Promise.all([
        requestJson("/api/inventory/products"),
        requestJson("/api/inventory/stock"),
        requestJson("/api/inventory/orders"),
      ])
      setProducts((productsRes.products || []).map(mapProduct))
      setStockItems((stockRes.stock || []).map(mapStock))
      setOrders((ordersRes.orders || []).map(mapOrder))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addProduct = async (data: Omit<Product, "id">) => {
    const response = await requestJson("/api/inventory/products", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const [saved] = response.products || []
    if (saved) {
      setProducts((prev) => [mapProduct(saved), ...prev])
    }
  }

  const updateProduct = async (id: string, data: Omit<Product, "id">) => {
    const response = await requestJson("/api/inventory/products", {
      method: "PATCH",
      body: JSON.stringify({ id, ...data }),
    })
    setProducts((prev) => prev.map((product) => (product.id === id ? mapProduct(response.product) : product)))
  }

  const deleteProduct = async (id: string) => {
    await requestJson(`/api/inventory/products?id=${id}`, { method: "DELETE" })
    setProducts((prev) => prev.filter((product) => product.id !== id))
  }

  const addStockItem = async (data: Omit<StockItem, "id">) => {
    const response = await requestJson("/api/inventory/stock", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const [saved] = response.stock || []
    if (saved) {
      setStockItems((prev) => [mapStock(saved), ...prev])
    }
  }

  const updateStockItem = async (id: string, data: Omit<StockItem, "id">) => {
    const response = await requestJson("/api/inventory/stock", {
      method: "PATCH",
      body: JSON.stringify({ id, ...data }),
    })
    setStockItems((prev) => prev.map((item) => (item.id === id ? mapStock(response.stock) : item)))
  }

  const deleteStockItem = async (id: string) => {
    await requestJson(`/api/inventory/stock?id=${id}`, { method: "DELETE" })
    setStockItems((prev) => prev.filter((item) => item.id !== id))
  }

  const addOrder = async (data: Omit<PurchaseOrder, "id">) => {
    const response = await requestJson("/api/inventory/orders", {
      method: "POST",
      body: JSON.stringify(data),
    })
    const [saved] = response.orders || []
    if (saved) {
      setOrders((prev) => [mapOrder(saved), ...prev])
    }
  }

  const updateOrder = async (id: string, data: Omit<PurchaseOrder, "id">) => {
    const response = await requestJson("/api/inventory/orders", {
      method: "PATCH",
      body: JSON.stringify({ id, ...data }),
    })
    setOrders((prev) => prev.map((order) => (order.id === id ? mapOrder(response.order) : order)))
  }

  const deleteOrder = async (id: string) => {
    await requestJson(`/api/inventory/orders?id=${id}`, { method: "DELETE" })
    setOrders((prev) => prev.filter((order) => order.id !== id))
  }

  const handleAddProduct = async () => {
    if (!productForm.name || !productForm.sku) return
    try {
      await addProduct({
        name: productForm.name,
        sku: productForm.sku,
        price: Number(productForm.price || 0),
        cost: Number(productForm.cost || 0),
        category: productForm.category || "General",
        supplier: "Supplier",
        status: "active",
      })
      setProductForm({ name: "", sku: "", price: "", cost: "", category: "" })
      setOpenProductDialog(false)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product")
    }
  }

  const splitCsvLine = (line: string) => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result.map((value) => value.trim())
  }

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    if (!lines.length) return []
    const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase())
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line)
      const record: Record<string, string> = {}
      headers.forEach((header, index) => {
        record[header] = values[index] ?? ""
      })
      return record
    })
  }

  const parseNumber = (value: string) => {
    const cleaned = String(value || "").replace(/[^0-9.-]/g, "")
    return Number.parseFloat(cleaned || "0")
  }

  const downloadTemplate = (type: "products" | "stock" | "orders") => {
    const templates = {
      products: {
        headers: ["sku", "name", "category", "price", "cost", "supplier", "status"],
        sample: ["PROD-001", "Laptop Pro 15", "Electronics", "1299", "800", "TechGear Inc", "active"],
        filename: "inventory-products-template.csv",
      },
      stock: {
        headers: ["sku", "name", "currentStock", "reorderPoint", "reorderQuantity", "warehouseLocation", "status"],
        sample: ["PROD-002", "Wireless Mouse", "8", "15", "50", "B-5-2", "critical"],
        filename: "inventory-stock-template.csv",
      },
      orders: {
        headers: ["orderNo", "supplier", "items", "totalValue", "expectedDelivery", "status"],
        sample: ["PO-2025-001", "TechGear Inc", "50", "32500", "2025-02-05", "ordered"],
        filename: "inventory-orders-template.csv",
      },
    }
    const template = templates[type]
    const csv = [template.headers.join(","), template.sample.join(",")].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = template.filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File, type: "products" | "stock" | "orders") => {
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (!rows.length) {
        setImportNotice("No rows found in file.")
        return
      }

      if (type === "products") {
        await requestJson("/api/inventory/products", {
          method: "POST",
          body: JSON.stringify(
            rows.map((row) => ({
              sku: row.sku || `PROD-IMP-${Math.random().toString(36).slice(2, 7)}`,
              name: row.name || "Imported Product",
              category: row.category || "General",
              price: parseNumber(row.price),
              cost: parseNumber(row.cost),
              supplier: row.supplier || "Supplier",
              status: row.status || "active",
            })),
          ),
        })
      }

      if (type === "stock") {
        await requestJson("/api/inventory/stock", {
          method: "POST",
          body: JSON.stringify(
            rows.map((row) => ({
              sku: row.sku || `PROD-IMP-${Math.random().toString(36).slice(2, 7)}`,
              name: row.name || "Imported Item",
              currentStock: parseNumber(row.currentstock),
              reorderPoint: parseNumber(row.reorderpoint),
              reorderQuantity: parseNumber(row.reorderquantity),
              warehouseLocation: row.warehouselocation || "A-0-0",
              status: row.status || "ok",
            })),
          ),
        })
      }

      if (type === "orders") {
        await requestJson("/api/inventory/orders", {
          method: "POST",
          body: JSON.stringify(
            rows.map((row, index) => ({
              orderNo: row.orderno || `PO-IMP-${index + 1}`,
              supplier: row.supplier || "Supplier",
              items: parseNumber(row.items),
              totalValue: parseNumber(row.totalvalue),
              orderDate: new Date().toISOString().slice(0, 10),
              expectedDelivery: row.expecteddelivery || new Date().toISOString().slice(0, 10),
              status: row.status || "draft",
            })),
          ),
        })
      }

      await loadData()
      setImportNotice(`Imported ${rows.length} ${type}. Switch tabs to view.`)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage products, stock, and orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={() => setActiveTab("orders")}>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
          <Dialog open={openProductDialog} onOpenChange={setOpenProductDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>Create a new product in your inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prod-name">Product Name</Label>
                  <Input
                    id="prod-name"
                    placeholder="e.g., Office Chair"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="e.g., CHR-001"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Selling Price</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="e.g., 150000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost Price</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="e.g., 80000"
                    value={productForm.cost}
                    onChange={(e) => setProductForm({ ...productForm, cost: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Office Furniture"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error ? <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div> : null}

      <div className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Inventory Pulse</p>
            <p className="text-sm text-muted-foreground">Imports ready. Track products, stock, and orders.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Products: {products.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Stock lines: {stockItems.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">Orders: {orders.length}</span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">{loading ? "Syncing" : "Live DB"}</span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <ProductsTable
            searchQuery={searchQuery}
            products={products}
            onAddProduct={addProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        </TabsContent>

        <TabsContent value="stock" className="space-y-4">
          <StockLevels
            searchQuery={searchQuery}
            items={stockItems}
            onAddItem={addStockItem}
            onUpdateItem={updateStockItem}
            onDeleteItem={deleteStockItem}
          />
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <OrdersTable
            searchQuery={searchQuery}
            orders={orders}
            onAddOrder={addOrder}
            onUpdateOrder={updateOrder}
            onDeleteOrder={deleteOrder}
          />
        </TabsContent>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Inventory Data</CardTitle>
              <CardDescription>Download a CSV template and upload your data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {importNotice ? <div className="text-sm text-primary">{importNotice}</div> : null}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { type: "products", title: "Products CSV" },
                  { type: "stock", title: "Stock Levels CSV" },
                  { type: "orders", title: "Purchase Orders CSV" },
                ].map((item) => (
                  <div key={item.type} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 text-primary" />
                      <p className="font-medium">{item.title}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="bg-transparent w-full"
                      onClick={() => downloadTemplate(item.type as "products" | "stock" | "orders")}
                    >
                      Download template
                    </Button>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImport(file, item.type as "products" | "stock" | "orders")
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
