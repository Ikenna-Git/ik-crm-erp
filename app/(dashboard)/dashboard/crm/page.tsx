"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Sparkles } from "lucide-react"
import { ContactsTable } from "@/components/crm/contacts-table"
import { DealsBoard } from "@/components/crm/deals-board"
import { ActivitiesTimeline } from "@/components/crm/activities-timeline"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const crmNames = ["Adaeze Okafor", "Emeka Umeh", "Sarah Johnson", "David Chen", "Ibrahim Musa", "Lena Martins", "Grace Williams", "Noah Brown"]
const crmCompanies = ["Northwind", "Acme Corp", "Venture Labs", "Globex", "NovaWorks", "Blue Ridge", "Nimbus", "Zenith"]
const crmStages = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"] as const

const buildFallbackContacts = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const name = crmNames[idx % crmNames.length]
    const company = crmCompanies[idx % crmCompanies.length]
    const statusOptions = ["lead", "prospect", "customer"] as const
    return {
      id: `C-${(idx + 1).toString().padStart(3, "0")}`,
      name,
      email: `${name.split(" ")[0].toLowerCase()}@${company.toLowerCase().replace(/\s+/g, "")}.com`,
      phone: `+234 80${(10 + idx).toString().padStart(2, "0")} ${(100 + idx).toString().padStart(3, "0")} ${(4000 + idx).toString().padStart(4, "0")}`,
      company,
      status: statusOptions[idx % statusOptions.length],
      revenue: idx % 3 === 0 ? 90000 + (idx % 6) * 15000 : 0,
      lastContact: `${(idx % 7) + 1}d ago`,
    }
  })

const buildFallbackDeals = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const company = crmCompanies[idx % crmCompanies.length]
    const owner = crmNames[idx % crmNames.length]
    const stage = crmStages[idx % crmStages.length]
    const value = 75000 + (idx % 8) * 25000
    const expectedClose = new Date(2025, (idx % 6) + 1, (idx % 27) + 1).toISOString().slice(0, 10)
    return {
      id: `D-${(idx + 1).toString().padStart(3, "0")}`,
      title: `Civis Suite ${idx % 2 === 0 ? "Implementation" : "License"} - ${company}`,
      company,
      value,
      stage,
      owner,
      expectedClose,
    }
  })

const fallbackContacts = buildFallbackContacts(70)
const fallbackDeals = buildFallbackDeals(70)

export default function CRMPage() {
  const searchQuery = ""
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "prospect",
  })

  const parseJsonSafe = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      const [contactsRes, dealsRes] = await Promise.all([
        fetch("/api/crm/contacts"),
        fetch("/api/crm/deals"),
      ])
      const contactsJson = contactsRes.ok ? await parseJsonSafe(contactsRes) : null
      const dealsJson = dealsRes.ok ? await parseJsonSafe(dealsRes) : null

      const loadedContacts =
        contactsJson?.contacts?.length > 0
          ? contactsJson.contacts.map((c: any) => ({
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              company: c.companyId || "",
              status: c.status || "prospect",
              revenue: c.revenue || 0,
              lastContact: c.lastContact || "—",
            }))
          : fallbackContacts

      const loadedDeals = dealsJson?.deals?.length ? dealsJson.deals : fallbackDeals

      setContacts(loadedContacts)
      setDeals(loadedDeals)
    } catch (err) {
      console.error("Failed to load CRM data", err)
      setContacts(fallbackContacts)
      setDeals(fallbackDeals)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContactAPI = async (payload: { name: string; email: string; phone?: string; company?: string; status: string }) => {
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: payload.name, email: payload.email, phone: payload.phone }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to add contact")
      const contact = {
        id: data.contact.id,
        name: data.contact.name,
        email: data.contact.email,
        phone: data.contact.phone,
        company: payload.company || "",
        status: (payload.status as any) || "prospect",
        revenue: 0,
        lastContact: "Just now",
      }
      setContacts((prev) => [...prev, contact])
      return contact
    } catch (err) {
      console.warn("Failed to add contact via API, falling back to local data", err)
      const fallback = {
        id: `C${Date.now()}`,
        ...payload,
        revenue: 0,
        lastContact: "Just now",
      }
      setContacts((prev) => [...prev, fallback])
      return fallback
    }
  }

  const handleDeleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddContact = async () => {
    if (formData.name && formData.email) {
      await handleAddContactAPI(formData)
      setFormData({ name: "", email: "", phone: "", status: "prospect" })
      setOpenAddDialog(false)
    }
  }

  const handleUpdateContact = (id: string, data: any) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, lastContact: "Updated just now" } : c)))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage contacts, deals, and sales activities</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        </div>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>Create a new contact in your CRM system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name</Label>
                <Input
                  id="name"
                  placeholder="Company or contact name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+234 800 123 4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddContact} className="w-full">
                Add Contact
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* CRM Pulse */}
      <div className="rounded-xl border border-border bg-card/70 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">CRM Focus</p>
            <p className="text-sm text-muted-foreground">Track pipeline momentum and follow-ups.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Contacts: {contacts.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Deals: {deals.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Active follow-ups: {deals.filter((deal) => ["proposal", "negotiation"].includes(deal.stage)).length}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="deals">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <ContactsTable
            searchQuery={searchQuery}
            contacts={contacts}
            onAddContact={handleAddContactAPI}
            onDeleteContact={handleDeleteContact}
            onUpdateContact={handleUpdateContact}
          />
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <DealsBoard deals={deals} />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <ActivitiesTimeline />
        </TabsContent>
      </Tabs>
    </div>
  )
}
