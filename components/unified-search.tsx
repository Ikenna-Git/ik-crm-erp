"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { unifiedSearchItems } from "@/lib/unified-search"

type SearchResult = {
  id: string
  title: string
  subtitle: string
  category: string
  href: string
  type: string
}

export function UnifiedSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setCategory("")
      setResults([])
      setHasSearched(false)
    }
  }, [open])

  useEffect(() => {
    const search = async () => {
      if (!query.trim() || query.length < 2) {
        setResults([])
        setHasSearched(false)
        return
      }

      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query })
        if (category) params.set("category", category)

        const response = await fetch(`/api/search?${params}`)
        const data = await response.json()

        if (response.ok) {
          setResults(data.results || [])
        } else {
          setResults([])
        }
        setHasSearched(true)
      } catch (error) {
        console.error("Search failed:", error)
        setResults([])
        setHasSearched(true)
      } finally {
        setLoading(false)
      }
    }

    const debounceTimer = setTimeout(search, 300)
    return () => clearTimeout(debounceTimer)
  }, [query, category])

  const grouped = useMemo(() => {
    const allResults = hasSearched ? results : unifiedSearchItems.filter(item =>
      !query.trim() || (
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    )

    return allResults.reduce<Record<string, typeof allResults>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [results, query, hasSearched])

  const groups = Object.entries(grouped)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden md:flex items-center gap-2 bg-transparent"
        onClick={() => setOpen(true)}
      >
        <Search className="w-4 h-4" />
        Search
        <span className="ml-2 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
          Cmd K
        </span>
      </Button>
      <Button variant="outline" size="icon" className="md:hidden bg-transparent" onClick={() => setOpen(true)}>
        <Search className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unified Search</DialogTitle>
            <DialogDescription>Search contacts, deals, invoices, docs, and more.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type to search across Civis..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
                className="flex-1"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-32">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="accounting">Accounting</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  <SelectItem value="contacts">Contacts</SelectItem>
                  <SelectItem value="companies">Companies</SelectItem>
                  <SelectItem value="deals">Deals</SelectItem>
                  <SelectItem value="invoices">Invoices</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="max-h-[60vh] overflow-auto space-y-6 pr-2">
              {loading ? (
                <div className="text-sm text-muted-foreground">Searching...</div>
              ) : Object.keys(grouped).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {query.trim() ? "No results found. Try another keyword." : "Start typing to search..."}
                </div>
              ) : (
                Object.entries(grouped).map(([categoryName, items]) => (
                  <div key={categoryName} className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                      <span>{categoryName}</span>
                      <Badge variant="outline">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className="flex items-start justify-between gap-4 rounded-lg border border-border bg-background px-3 py-3 transition hover:border-primary/40"
                        >
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
