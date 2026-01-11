"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, X, Download, MoreHorizontal, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Product {
  id: string
  sku: string
  name: string
  category: string
  price: number
  cost: number
  supplier: string
  status: "active" | "inactive" | "discontinued"
}

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-yellow-100 text-yellow-800",
  discontinued: "bg-red-100 text-red-800",
}

const mockProducts: Product[] = [
  {
    id: "1",
    sku: "PROD-001",
    name: 'Laptop Pro 15"',
    category: "Electronics",
    price: 1299,
    cost: 800,
    supplier: "TechGear Inc",
    status: "active",
  },
  {
    id: "2",
    sku: "PROD-002",
    name: "Wireless Mouse",
    category: "Accessories",
    price: 29,
    cost: 12,
    supplier: "PeripheralCo",
    status: "active",
  },
  {
    id: "3",
    sku: "PROD-003",
    name: "USB-C Cable",
    category: "Cables",
    price: 15,
    cost: 5,
    supplier: "CableMaster",
    status: "active",
  },
  {
    id: "4",
    sku: "PROD-004",
    name: 'Monitor 4K 27"',
    category: "Electronics",
    price: 449,
    cost: 250,
    supplier: "DisplayTech",
    status: "inactive",
  },
]

const STORAGE_KEY = "civis_inventory_products"
const IMPORT_EVENT = "civis-inventory-import"

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

export function ProductsTable({ searchQuery }: { searchQuery: string }) {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    category: "",
    price: "",
    cost: "",
    supplier: "",
    status: "active" as Product["status"],
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setProducts(parsed)
          return
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts))
    } catch (err) {
      console.warn("Failed to load products", err)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ type?: string; items?: Product[] }>
      if (custom.detail?.type === "products" && Array.isArray(custom.detail.items)) {
        setProducts(custom.detail.items)
      }
    }
    window.addEventListener(IMPORT_EVENT, handler)
    return () => window.removeEventListener(IMPORT_EVENT, handler)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch (err) {
      console.warn("Failed to persist products", err)
    }
  }, [products])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const avgMargin = (
    products.reduce((sum, p) => sum + ((p.price - p.cost) / p.price) * 100, 0) / products.length
  ).toFixed(1)

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Product = {
      id: editingId || Date.now().toString(),
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: Number.parseFloat(formData.price),
      cost: Number.parseFloat(formData.cost),
      supplier: formData.supplier,
      status: formData.status,
    }
    if (editingId) {
      setProducts((prev) => prev.map((p) => (p.id === editingId ? payload : p)))
      setEditingId(null)
    } else {
      setProducts([...products, payload])
    }
    setFormData({ sku: "", name: "", category: "", price: "", cost: "", supplier: "", status: "active" })
    setShowModal(false)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id))
  }

  const handleEditProduct = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      price: String(product.price),
      cost: String(product.cost),
      supplier: product.supplier,
      status: product.status,
    })
    setShowModal(true)
  }

  const downloadProductsCSV = () => {
    const headers = ["SKU", "Name", "Category", "Price", "Cost", "Supplier", "Status"]
    const rows = products.map((p) => [p.sku, p.name, p.category, p.price, p.cost, p.supplier, p.status])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "products.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Products</p>
            <p className="text-2xl font-bold">{products.filter((p) => p.status === "active").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Margin</p>
            <p className="text-2xl font-bold text-primary">{avgMargin}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total SKUs</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Product Catalog ({filteredProducts.length})</CardTitle>
            <CardDescription>All products in inventory</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadProductsCSV}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Cost</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const margin = (((product.price - product.cost) / product.price) * 100).toFixed(0)
                  return (
                    <tr key={product.id} className="border-b border-border hover:bg-muted/50 transition">
                      <td className="py-4 px-4 font-mono font-semibold text-sm">{product.sku}</td>
                      <td className="py-4 px-4 font-medium">{product.name}</td>
                      <td className="py-4 px-4">{product.category}</td>
                      <td className="py-4 px-4 font-semibold">{formatNaira(product.price)}</td>
                      <td className="py-4 px-4">{formatNaira(product.cost)}</td>
                      <td className="py-4 px-4 text-muted-foreground text-xs">{product.supplier}</td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className={statusColors[product.status]}>
                          {product.status}
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
                            <DropdownMenuItem onClick={() => alert(JSON.stringify(product, null, 2))}>
                              <Eye className="w-4 h-4 mr-2" />
                              View details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
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

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-screen overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-3 sticky top-0 bg-background">
              <CardTitle>{editingId ? "Edit Product" : "Add New Product"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="pb-6">
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">SKU</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="PROD-005"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Product Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Electronics"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="999.99"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cost</label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="500.00"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Supplier</label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Product["status"] })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 bg-transparent"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingId ? "Save Changes" : "Add Product"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
