"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowUpRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { unifiedSearchItems } from "@/lib/unified-search"

export function UnifiedSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

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
    if (!open) setQuery("")
  }, [open])

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return unifiedSearchItems
    return unifiedSearchItems.filter((item) => {
      return (
        item.title.toLowerCase().includes(value) ||
        item.subtitle.toLowerCase().includes(value) ||
        item.category.toLowerCase().includes(value)
      )
    })
  }, [query])

  const grouped = useMemo(() => {
    return filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = []
      acc[item.category].push(item)
      return acc
    }, {})
  }, [filtered])

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
            <Input
              placeholder="Type to search across Civis..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <div className="max-h-[60vh] overflow-auto space-y-6 pr-2">
              {groups.length === 0 ? (
                <div className="text-sm text-muted-foreground">No results. Try another keyword.</div>
              ) : (
                groups.map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                      <span>{category}</span>
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
