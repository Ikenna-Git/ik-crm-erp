"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search } from "lucide-react"
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

const fallbackContacts = [
  { id: "C-001", name: "Adaeze Okafor", email: "adaeze@civis.io", phone: "+234 801 000 1234", company: "Northwind", status: "prospect", revenue: 0, lastContact: "3d ago" },
  { id: "C-002", name: "Emeka Umeh", email: "emeka@acmecorp.com", phone: "+234 802 321 4567", company: "Acme Corp", status: "customer", revenue: 120000, lastContact: "1d ago" },
  { id: "C-003", name: "Sarah Johnson", email: "sarah@venturelabs.com", phone: "+1 555 222 9898", company: "Venture Labs", status: "lead", revenue: 0, lastContact: "5h ago" },
]

const fallbackDeals = [
  { id: "D-001", title: "Annual License - Civis Core", company: "Acme Corp", value: 250000, stage: "proposal", owner: "Adaeze Okafor", expectedClose: "2025-02-15" },
  { id: "D-002", title: "Implementation + Training", company: "Northwind", value: 175000, stage: "negotiation", owner: "Emeka Umeh", expectedClose: "2025-01-30" },
  { id: "D-003", title: "Pilot - 50 seats", company: "Venture Labs", value: 95000, stage: "qualified", owner: "Sarah Johnson", expectedClose: "2025-03-05" },
  { id: "D-004", title: "Renewal Q2", company: "Globex", value: 140000, stage: "won", owner: "Adaeze Okafor", expectedClose: "2025-04-01" },
]

export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState("")
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts, deals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
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
