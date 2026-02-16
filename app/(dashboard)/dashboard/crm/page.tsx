"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Download } from "lucide-react"
import { ContactsTable } from "@/components/crm/contacts-table"
import { DealsBoard } from "@/components/crm/deals-board"
import { ActivitiesTimeline } from "@/components/crm/activities-timeline"
import { CrmReports } from "@/components/crm/crm-reports"
import { CompaniesTable } from "@/components/crm/companies-table"
import { CrmQualityScorecard } from "@/components/crm/data-quality-scorecard"
import { FollowupSchedulerCard, type FollowupSummary } from "@/components/crm/followup-scheduler-card"
import { getSessionHeaders } from "@/lib/user-settings"
import { DEFAULT_CRM_VIEWS } from "@/lib/user-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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
      lastContactAt: new Date(2025, (idx % 6) + 1, (idx % 27) + 1).toISOString(),
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
      updatedAt: new Date(2025, idx % 6, (idx % 27) + 1).toISOString(),
    }
  })

const buildFallbackCompanies = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const name = crmCompanies[idx % crmCompanies.length]
    const industries = ["Fintech", "Retail", "Logistics", "Healthcare", "Manufacturing", "Education"]
    const sizes = ["1-10", "11-50", "51-200", "201-500", "500+"]
    return {
      id: `CO-${(idx + 1).toString().padStart(3, "0")}`,
      name,
      industry: industries[idx % industries.length],
      size: sizes[idx % sizes.length],
      owner: crmNames[idx % crmNames.length],
      updatedAt: new Date(2025, idx % 12, (idx % 27) + 1).toISOString(),
    }
  })

const fallbackContacts = buildFallbackContacts(70)
const fallbackDeals = buildFallbackDeals(70)
const fallbackCompanies = buildFallbackCompanies(50)

export default function CRMPage() {
  const searchQuery = ""
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [deals, setDeals] = useState<any[]>([])
  const [crmViews, setCrmViews] = useState(DEFAULT_CRM_VIEWS)
  const [exportEmail, setExportEmail] = useState("ikchils@gmail.com")
  const [openExportDialog, setOpenExportDialog] = useState(false)
  const [followupSummary, setFollowupSummary] = useState<FollowupSummary | null>(null)
  const [followupLoading, setFollowupLoading] = useState(false)
  const [followupNotice, setFollowupNotice] = useState("")

  const parseJsonSafe = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`)
    }
  }

  const toDate = (value?: string | null) => {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const daysIdleFrom = (value?: string | null) => {
    const date = toDate(value)
    if (!date) return null
    return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)))
  }

  const getPriority = (type: "contact" | "deal", daysIdle: number) => {
    if (type === "contact") {
      if (daysIdle >= 45) return "critical" as const
      if (daysIdle >= 30) return "high" as const
      return "normal" as const
    }
    if (daysIdle >= 20) return "critical" as const
    if (daysIdle >= 14) return "high" as const
    return "normal" as const
  }

  const priorityWeight = {
    critical: 3,
    high: 2,
    normal: 1,
  } as const

  const sortByPriorityAndAge = <T extends { priority: "critical" | "high" | "normal"; daysIdle: number; label: string }>(
    items: T[],
  ) =>
    [...items].sort((a, b) => {
      const priorityDelta = priorityWeight[b.priority] - priorityWeight[a.priority]
      if (priorityDelta !== 0) return priorityDelta
      const idleDelta = b.daysIdle - a.daysIdle
      if (idleDelta !== 0) return idleDelta
      return a.label.localeCompare(b.label)
    })

  const buildLocalFollowups = () => {
    const inactiveContacts = sortByPriorityAndAge(
      contacts
        .map((contact) => {
          const daysIdle = daysIdleFrom(contact.lastContactAt || contact.updatedAt)
          if (daysIdle === null || daysIdle < 21) return null
          return {
            id: contact.id,
            label: contact.name,
            meta: `${daysIdle} days idle`,
            daysIdle,
            priority: getPriority("contact", daysIdle),
          }
        })
        .filter(Boolean) as Array<{ id: string; label: string; meta: string; daysIdle: number; priority: "critical" | "high" | "normal" }>,
    ).slice(0, 10)

    const stalledDeals = sortByPriorityAndAge(
      deals
        .map((deal) => {
          if (!["proposal", "negotiation", "qualified"].includes(String(deal.stage).toLowerCase())) return null
          const daysIdle = daysIdleFrom(deal.updatedAt)
          if (daysIdle === null || daysIdle < 10) return null
          return {
            id: deal.id,
            label: deal.title,
            meta: `${String(deal.stage).toLowerCase()} • ${daysIdle} days`,
            daysIdle,
            priority: getPriority("deal", daysIdle),
          }
        })
        .filter(Boolean) as Array<{ id: string; label: string; meta: string; daysIdle: number; priority: "critical" | "high" | "normal" }>,
    ).slice(0, 10)

    return {
      inactiveContacts: { count: inactiveContacts.length, items: inactiveContacts },
      stalledDeals: { count: stalledDeals.length, items: stalledDeals },
      generatedAt: new Date().toISOString(),
    }
  }

  const loadFollowups = async () => {
    try {
      setFollowupLoading(true)
      setFollowupNotice("")
      const res = await fetch("/api/crm/followups", { headers: { ...getSessionHeaders() } })
      if (res.status === 503) {
        setFollowupSummary(buildLocalFollowups())
        return
      }
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to load follow-ups")
      setFollowupSummary(data.summary)
      if (data?.simulated) {
        setFollowupNotice("Showing simulated follow-ups while database is offline.")
      }
    } catch (err: any) {
      console.warn("Failed to load follow-ups", err)
      setFollowupSummary(buildLocalFollowups())
    } finally {
      setFollowupLoading(false)
    }
  }

  const handleGenerateFollowups = async () => {
    try {
      setFollowupLoading(true)
      setFollowupNotice("")
      const res = await fetch("/api/crm/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({}),
      })
      if (res.status === 503) {
        setFollowupNotice("Connect your database to generate real follow-up tasks.")
        return
      }
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to generate follow-ups")
      const created = data.created?.contacts + data.created?.deals
      if (data?.simulated) {
        setFollowupNotice(`Simulated mode: generated ${created || 0} follow-up tasks while DB is offline.`)
        setFollowupSummary(data.summary)
        return
      }
      const skipped = Number(data.skipped || 0)
      setFollowupNotice(
        skipped > 0
          ? `Generated ${created || 0} follow-up tasks. ${skipped} item(s) were skipped safely.`
          : `Generated ${created || 0} follow-up tasks.`,
      )
      setFollowupSummary(data.summary)
    } catch (err: any) {
      setFollowupNotice(err?.message || "Failed to generate follow-ups.")
    } finally {
      setFollowupLoading(false)
    }
  }

  const formatLastContact = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  }

  const mapContact = (contact: any) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    company: contact.company?.name || contact.companyName || "",
    status: String(contact.status || "prospect").toLowerCase(),
    revenue: contact.revenue || 0,
    lastContact: formatLastContact(contact.lastContact),
    lastContactAt: contact.lastContact ? new Date(contact.lastContact).toISOString() : contact.updatedAt || null,
    updatedAt: contact.updatedAt ? new Date(contact.updatedAt).toISOString() : null,
    customFields: contact.customFields || {},
  })

  const mapDeal = (deal: any) => ({
    id: deal.id,
    title: deal.title,
    company: deal.company?.name || deal.companyName || deal.companyId || "",
    companyId: deal.companyId || null,
    value: deal.value,
    stage: String(deal.stage || "prospect").toLowerCase(),
    owner: deal.owner?.name || deal.ownerName || deal.ownerId || "",
    ownerId: deal.ownerId || null,
    contactId: deal.contactId || null,
    expectedClose: deal.expectedClose ? new Date(deal.expectedClose).toISOString().slice(0, 10) : undefined,
    updatedAt: deal.updatedAt ? new Date(deal.updatedAt).toISOString() : null,
    customFields: deal.customFields || {},
  })

  const mapCompany = (company: any) => ({
    id: company.id,
    name: company.name,
    industry: company.industry || "",
    size: company.size || "",
    owner: company.owner?.name || company.ownerName || "",
    ownerId: company.ownerId || null,
    updatedAt: company.updatedAt ? new Date(company.updatedAt).toISOString().slice(0, 10) : "",
    customFields: company.customFields || {},
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [contactsRes, dealsRes, companiesRes] = await Promise.all([
        fetch("/api/crm/contacts", { headers: { ...getSessionHeaders() } }),
        fetch("/api/crm/deals", { headers: { ...getSessionHeaders() } }),
        fetch("/api/crm/companies", { headers: { ...getSessionHeaders() } }),
      ])
      const contactsJson = contactsRes.ok ? await parseJsonSafe(contactsRes) : null
      const dealsJson = dealsRes.ok ? await parseJsonSafe(dealsRes) : null
      const companiesJson = companiesRes.ok ? await parseJsonSafe(companiesRes) : null

      const loadedContacts =
        contactsJson?.contacts?.length > 0 ? contactsJson.contacts.map(mapContact) : fallbackContacts

      const loadedDeals = dealsJson?.deals?.length ? dealsJson.deals.map(mapDeal) : fallbackDeals
      const loadedCompanies =
        companiesJson?.companies?.length > 0 ? companiesJson.companies.map(mapCompany) : fallbackCompanies

      setContacts(loadedContacts)
      setDeals(loadedDeals)
      setCompanies(loadedCompanies)
    } catch (err) {
      console.error("Failed to load CRM data", err)
      setContacts(fallbackContacts)
      setDeals(fallbackDeals)
      setCompanies(fallbackCompanies)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContactAPI = async (payload: {
    name: string
    email: string
    phone?: string
    company?: string
    status: string
    customFields?: Record<string, any>
  }) => {
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          status: payload.status,
          lastContact: new Date().toISOString(),
          customFields: payload.customFields || {},
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to add contact")
      const contact = mapContact(data.contact)
      setContacts((prev) => [...prev, contact])
      return contact
    } catch (err) {
      console.warn("Failed to add contact via API, falling back to local data", err)
      const fallback = {
        id: `C${Date.now()}`,
        ...payload,
        revenue: 0,
        lastContact: "Just now",
        customFields: payload.customFields || {},
      }
      setContacts((prev) => [...prev, fallback])
      return fallback
    }
  }

  const handleDeleteContact = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/contacts?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) {
        const data = await parseJsonSafe(res)
        throw new Error(data?.error || "Failed to delete contact")
      }
    } catch (err) {
      console.warn("Failed to delete contact", err)
    } finally {
      setContacts((prev) => prev.filter((c) => c.id !== id))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (contacts.length || deals.length) {
      loadFollowups()
    }
  }, [contacts.length, deals.length])

  useEffect(() => {
    const loadViews = async () => {
      try {
        const res = await fetch("/api/user/settings", { headers: { ...getSessionHeaders() } })
        if (res.status === 503) return
        const data = await parseJsonSafe(res)
        if (data?.crmViews) {
          setCrmViews({
            contacts: data.crmViews.contacts || DEFAULT_CRM_VIEWS.contacts,
            companies: data.crmViews.companies || DEFAULT_CRM_VIEWS.companies,
            deals: data.crmViews.deals || DEFAULT_CRM_VIEWS.deals,
          })
        }
      } catch (err) {
        console.warn("Failed to load CRM views", err)
      }
    }
    loadViews()
  }, [])

  const handleViewChange = async (entity: "contacts" | "companies" | "deals", view: any) => {
    setCrmViews((prev) => ({ ...prev, [entity]: view }))
    try {
      await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ crmViews: { [entity]: view } }),
      })
    } catch (err) {
      console.warn("Failed to save CRM view", err)
    }
  }

  const handleUpdateContact = async (id: string, data: any) => {
    try {
      const res = await fetch("/api/crm/contacts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ id, ...data, lastContact: new Date().toISOString() }),
      })
      const payload = await parseJsonSafe(res)
      if (!res.ok) throw new Error(payload?.error || "Failed to update contact")
      const updated = mapContact(payload.contact)
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      console.warn("Failed to update contact", err)
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data, lastContact: "Updated just now" } : c)),
      )
    }
  }

  const handleAddCompanyAPI = async (payload: {
    name: string
    industry?: string
    size?: string
    customFields?: Record<string, any>
  }) => {
    try {
      const res = await fetch("/api/crm/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          name: payload.name,
          industry: payload.industry,
          size: payload.size,
          customFields: payload.customFields || {},
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to add company")
      const company = mapCompany(data.company)
      setCompanies((prev) => [...prev, company])
      return company
    } catch (err) {
      console.warn("Failed to add company via API, falling back to local data", err)
      const fallback = {
        id: `CO-${Date.now()}`,
        ...payload,
        owner: "—",
        updatedAt: new Date().toISOString().slice(0, 10),
      }
      setCompanies((prev) => [...prev, fallback])
      return fallback
    }
  }

  const handleUpdateCompany = async (id: string, data: any) => {
    try {
      const res = await fetch("/api/crm/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ id, ...data }),
      })
      const payload = await parseJsonSafe(res)
      if (!res.ok) throw new Error(payload?.error || "Failed to update company")
      const updated = mapCompany(payload.company)
      setCompanies((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch (err) {
      console.warn("Failed to update company", err)
      setCompanies((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
    }
  }

  const handleDeleteCompany = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/companies?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) {
        const data = await parseJsonSafe(res)
        throw new Error(data?.error || "Failed to delete company")
      }
    } catch (err) {
      console.warn("Failed to delete company", err)
    } finally {
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const handleAddDealAPI = async (payload: {
    title: string
    value: number
    stage: string
    company?: string
    expectedClose?: string
    customFields?: Record<string, any>
  }) => {
    try {
      const res = await fetch("/api/crm/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({
          title: payload.title,
          value: payload.value,
          stage: payload.stage,
          company: payload.company,
          expectedClose: payload.expectedClose,
          customFields: payload.customFields || {},
        }),
      })
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to add deal")
      const deal = mapDeal(data.deal)
      setDeals((prev) => [...prev, deal])
      return deal
    } catch (err) {
      console.warn("Failed to add deal via API, falling back to local data", err)
      const fallback = {
        id: `D-${Date.now()}`,
        ...payload,
        owner: "—",
      }
      setDeals((prev) => [...prev, fallback])
      return fallback
    }
  }

  const handleUpdateDeal = async (id: string, data: any) => {
    try {
      const res = await fetch("/api/crm/deals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ id, ...data }),
      })
      const payload = await parseJsonSafe(res)
      if (!res.ok) throw new Error(payload?.error || "Failed to update deal")
      const updated = mapDeal(payload.deal)
      setDeals((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      console.warn("Failed to update deal", err)
      setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...data } : d)))
    }
  }

  const handleExportReports = async (target: "desktop" | "email") => {
    try {
      if (target === "desktop") {
        const res = await fetch("/api/reports/export", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({ type: "crm", target: "desktop" }),
        })
        if (!res.ok) throw new Error("Failed to export")
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "crm-report.csv"
        link.click()
        window.URL.revokeObjectURL(url)
        return
      }

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify({ type: "crm", target: "email", email: exportEmail }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error || "Failed to send email")
        return
      }
      alert(data.message || "Report sent")
    } catch (err) {
      alert("Export failed. Please try again.")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-ai-anchor="crm-header">
            CRM Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Manage contacts, deals, and sales activities</p>
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Download className="w-4 h-4" />
                Export CRM
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Export CRM report</DialogTitle>
                <DialogDescription>Download or email your CRM CSV report.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="crm-export-email">Email</Label>
                  <Input
                    id="crm-export-email"
                    type="email"
                    value={exportEmail}
                    onChange={(e) => setExportEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleExportReports("desktop")}>
                    Export to Desktop
                  </Button>
                  <Button onClick={() => handleExportReports("email")}>Send to Email</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
            Companies: {companies.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Deals: {deals.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground">
            Active follow-ups: {deals.filter((deal) => ["proposal", "negotiation"].includes(deal.stage)).length}
          </span>
        </div>
      </div>

      <CrmQualityScorecard contacts={contacts} deals={deals} />
      <FollowupSchedulerCard
        summary={followupSummary}
        loading={followupLoading}
        notice={followupNotice}
        onGenerate={handleGenerateFollowups}
      />

      {/* Tabs */}
      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="deals">Sales Pipeline</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <ContactsTable
            searchQuery={searchQuery}
            contacts={contacts}
            onAddContact={handleAddContactAPI}
            onDeleteContact={handleDeleteContact}
            onUpdateContact={handleUpdateContact}
            crmView={crmViews.contacts}
            onViewChange={(view) => handleViewChange("contacts", view)}
          />
        </TabsContent>

        <TabsContent value="companies" className="space-y-4">
          <CompaniesTable
            companies={companies}
            onAddCompany={handleAddCompanyAPI}
            onDeleteCompany={handleDeleteCompany}
            onUpdateCompany={handleUpdateCompany}
            crmView={crmViews.companies}
            onViewChange={(view) => handleViewChange("companies", view)}
          />
        </TabsContent>

        {/* Deals Tab */}
        <TabsContent value="deals" className="space-y-4">
          <DealsBoard deals={deals} onAddDeal={handleAddDealAPI} onUpdateDeal={handleUpdateDeal} />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <ActivitiesTimeline />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <CrmReports />
        </TabsContent>
      </Tabs>
    </div>
  )
}
