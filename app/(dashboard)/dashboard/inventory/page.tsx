"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Search, Upload } from "lucide-react"
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
import { ProductsTable } from "@/components/inventory/products-table"
import { StockLevels } from "@/components/inventory/stock-levels"
import { OrdersTable } from "@/components/inventory/orders-table"

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [openProductDialog, setOpenProductDialog] = useState(false)
  const [importNotice, setImportNotice] = useState("")
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    category: "",
  })

  const handleAddProduct = () => {
    if (productForm.name && productForm.sku) {
      console.log("Adding product:", productForm)
      setProductForm({ name: "", sku: "", price: "", cost: "", category: "" })
      setOpenProductDialog(false)
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
    const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase())
    return lines.slice(1).map((line) => {
      const values = splitCsvLine(line)
      const record: Record<string, string> = {}
      headers.forEach((header, idx) => {
        record[header] = values[idx] ?? ""
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
    const text = await file.text()
    const rows = parseCsv(text)
    if (!rows.length) return setImportNotice("No rows found in file.")

    const keyMap = {
      products: "civis_inventory_products",
      stock: "civis_inventory_stock_levels",
      orders: "civis_inventory_orders",
    }

    const existing = (() => {
      try {
        const stored = localStorage.getItem(keyMap[type])
        return stored ? JSON.parse(stored) : []
      } catch {
        return []
      }
    })()

    let mapped: any[] = []
    if (type === "products") {
      mapped = rows.map((row, idx) => ({
        id: `IMP-PROD-${Date.now()}-${idx}`,
        sku: row.sku || `PROD-IMP-${idx + 1}`,
        name: row.name || "Imported Product",
        category: row.category || "General",
        price: parseNumber(row.price),
        cost: parseNumber(row.cost),
        supplier: row.supplier || "Supplier",
        status: (row.status as any) || "active",
      }))
    }
    if (type === "stock") {
      mapped = rows.map((row, idx) => ({
        id: `IMP-STOCK-${Date.now()}-${idx}`,
        sku: row.sku || `PROD-IMP-${idx + 1}`,
        name: row.name || "Imported Item",
        currentStock: parseNumber(row.currentstock),
        reorderPoint: parseNumber(row.reorderpoint),
        reorderQuantity: parseNumber(row.reorderquantity),
        warehouseLocation: row.warehouselocation || "A-0-0",
        status: (row.status as any) || "ok",
      }))
    }
    if (type === "orders") {
      mapped = rows.map((row, idx) => ({
        id: `IMP-ORDER-${Date.now()}-${idx}`,
        orderNo: row.orderno || `PO-IMP-${idx + 1}`,
        supplier: row.supplier || "Supplier",
        items: parseNumber(row.items),
        totalValue: parseNumber(row.totalvalue),
        orderDate: new Date().toISOString().slice(0, 10),
        expectedDelivery: row.expecteddelivery || new Date().toISOString().slice(0, 10),
        status: (row.status as any) || "draft",
      }))
    }

    const merged = [...mapped, ...existing]
    localStorage.setItem(keyMap[type], JSON.stringify(merged))
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("civis-inventory-import", { detail: { type, items: merged } }))
    }
    setImportNotice(`Imported ${mapped.length} ${type}. Switch tabs to view.`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage products, stock, and orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-transparent">
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
                    placeholder="e.g., 150,000"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost Price</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="e.g., 80,000"
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products, SKU, orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <ProductsTable searchQuery={searchQuery} />
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <StockLevels searchQuery={searchQuery} />
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <OrdersTable searchQuery={searchQuery} />
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
