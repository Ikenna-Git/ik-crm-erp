"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Eye,
  FileText,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Phone,
  Plus,
  Send,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getSessionHeaders } from "@/lib/user-settings"
import type { CrmViewSettings } from "@/lib/user-settings"
import { DEFAULT_CRM_VIEWS } from "@/lib/user-settings"
import {
  CustomFieldInput,
  formatCustomFieldValue,
  normalizeOptions,
  type CrmField,
  type CrmFieldType,
} from "@/components/crm/custom-field-input"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: "lead" | "prospect" | "customer"
  revenue?: number
  lastContact?: string
  customFields?: Record<string, any>
}

const contactFirstNames = ["Sarah", "Michael", "Emma", "John", "Lisa", "Ava", "Noah", "Grace", "Daniel", "Olivia"]
const contactLastNames = ["Johnson", "Chen", "Davis", "Smith", "Anderson", "Okafor", "Umeh", "Martins", "Williams", "Brown"]
const contactCompanies = [
  "Tech Solutions Inc",
  "StartUp Labs",
  "Enterprise Corp",
  "Northwind",
  "Acme Corp",
  "Globex",
  "Blue Ridge",
  "NovaWorks",
]

const buildMockContacts = (count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const first = contactFirstNames[idx % contactFirstNames.length]
    const last = contactLastNames[(idx * 2) % contactLastNames.length]
    const statusOptions: Contact["status"][] = ["lead", "prospect", "customer"]
    return {
      id: `CON-${(idx + 1).toString().padStart(3, "0")}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      phone: `+1 (555) ${(410 + idx).toString().padStart(3, "0")}-${(7000 + idx).toString().padStart(4, "0")}`,
      company: contactCompanies[idx % contactCompanies.length],
      status: statusOptions[idx % statusOptions.length],
      revenue: idx % 3 === 0 ? 25000 + (idx % 10) * 5000 : 0,
      lastContact: `${(idx % 7) + 1} days ago`,
    }
  })

const mockContacts: Contact[] = buildMockContacts(70)

const recommendedFields: Array<{ name: string; type: CrmFieldType; options?: string[] }> = [
  { name: "Date of Birth", type: "DATE" },
  { name: "Location", type: "TEXT" },
  { name: "State", type: "TEXT" },
  { name: "Country", type: "TEXT" },
  { name: "Lead Source", type: "SELECT", options: ["Referral", "Website", "Partner", "Ads", "Event"] },
  { name: "Lifecycle Stage", type: "SELECT", options: ["New", "Engaged", "Opportunity", "Customer", "Churned"] },
  { name: "Lead Score", type: "NUMBER" },
  { name: "Next Follow-up", type: "DATE" },
  { name: "Preferred Channel", type: "SELECT", options: ["Email", "WhatsApp", "Phone", "SMS", "In-person"] },
]

const statusColors = {
  customer: "bg-primary/10 text-primary",
  prospect: "bg-accent/10 text-accent",
  lead: "bg-muted text-muted-foreground dark:bg-slate-700/40 dark:text-slate-200",
}

const formatNaira = (amount: number = 0) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)
}

type TimelineEvent = {
  id: string
  type: "call" | "email" | "invoice" | "task" | "note" | "whatsapp" | "sms"
  title: string
  detail: string
  time: string
}

const timelineIcons = {
  call: Phone,
  email: Mail,
  invoice: FileText,
  task: CheckCircle2,
  note: MessageSquare,
  whatsapp: MessageCircle,
  sms: Send,
}

const timelineStyles = {
  call: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200",
  invoice: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  task: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  note: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200",
  whatsapp: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200",
  sms: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200",
}

const buildContactTimeline = (contact: Contact): TimelineEvent[] => [
  {
    id: `${contact.id}-call`,
    type: "call",
    title: "Discovery call completed",
    detail: `Spoke with ${contact.name} about ${contact.company || "their team"} goals.`,
    time: "3 days ago",
  },
  {
    id: `${contact.id}-email`,
    type: "email",
    title: "Proposal email sent",
    detail: "Shared Civis implementation scope and pricing.",
    time: "2 days ago",
  },
  {
    id: `${contact.id}-invoice`,
    type: "invoice",
    title: "Invoice drafted",
    detail: "Drafted onboarding invoice for review.",
    time: "Yesterday",
  },
  {
    id: `${contact.id}-task`,
    type: "task",
    title: "Follow-up scheduled",
    detail: "Assigned follow-up task to sales owner.",
    time: "Today",
  },
  {
    id: `${contact.id}-note`,
    type: "note",
    title: "Relationship notes added",
    detail: "Added next steps and decision criteria.",
    time: "Just now",
  },
]

type ContactsTableProps = {
  searchQuery: string
  contacts?: Contact[]
  onAddContact?: (
    data: Omit<Contact, "id" | "status" | "revenue" | "lastContact"> & { status: Contact["status"] },
  ) => void
  onDeleteContact?: (id: string) => void
  onUpdateContact?: (id: string, data: Partial<Contact>) => void
  crmView?: CrmViewSettings
  onViewChange?: (view: CrmViewSettings) => void
}

export function ContactsTable({
  searchQuery,
  contacts: providedContacts,
  onAddContact,
  onDeleteContact,
  onUpdateContact,
  crmView,
  onViewChange,
}: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>(providedContacts || mockContacts)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [timelineContact, setTimelineContact] = useState<Contact | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerType, setComposerType] = useState<"email" | "whatsapp" | "sms">("email")
  const [composerMessage, setComposerMessage] = useState("")
  const [fields, setFields] = useState<CrmField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [fieldsError, setFieldsError] = useState("")
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [fieldForm, setFieldForm] = useState({
    name: "",
    type: "TEXT" as CrmFieldType,
    options: "",
    required: false,
  })
  const [view, setView] = useState<CrmViewSettings>(crmView || DEFAULT_CRM_VIEWS.contacts)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead" as const,
    customFields: {} as Record<string, any>,
  })

  useEffect(() => {
    if (providedContacts) {
      setContacts(providedContacts)
    }
  }, [providedContacts])

  useEffect(() => {
    const loadFields = async () => {
      try {
        setFieldsLoading(true)
        setFieldsError("")
        const res = await fetch("/api/crm/fields?entity=contact", { headers: { ...getSessionHeaders() } })
        if (res.status === 503) {
          setFields([])
          return
        }
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "Failed to load fields")
        const loaded = Array.isArray(data.fields) ? data.fields : []
        setFields(loaded)
      } catch (err: any) {
        setFieldsError(err?.message || "Failed to load fields")
        setFields([])
      } finally {
        setFieldsLoading(false)
      }
    }
    loadFields()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const baseColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (contact: Contact) => (
          <div>
            <p className="font-medium">{contact.name}</p>
            <p className="text-xs text-muted-foreground">{contact.email}</p>
          </div>
        ),
      },
      {
        key: "company",
        label: "Company",
        render: (contact: Contact) => contact.company || "—",
      },
      {
        key: "status",
        label: "Status",
        render: (contact: Contact) => (
          <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[contact.status]}`}>
            {contact.status}
          </span>
        ),
      },
      {
        key: "revenue",
        label: "Revenue",
        render: (contact: Contact) => (contact.revenue ? formatNaira(contact.revenue) : "—"),
      },
      {
        key: "lastContact",
        label: "Last Contact",
        render: (contact: Contact) => contact.lastContact || "—",
      },
    ],
    [],
  )

  const baseColumnMap = useMemo(
    () => Object.fromEntries(baseColumns.map((column) => [column.key, column])),
    [baseColumns],
  )

  const slugifyKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

  const fieldTypeHelp: Record<CrmFieldType, { hint: string; example: string }> = {
    TEXT: { hint: "Use text for free-form notes or labels.", example: "e.g. Lagos" },
    NUMBER: { hint: "Numbers only, no currency symbols.", example: "e.g. 12" },
    CURRENCY: { hint: "Numeric amounts in NGN.", example: "e.g. 250000" },
    DATE: { hint: "Date format is YYYY-MM-DD.", example: "e.g. 2025-03-15" },
    SELECT: { hint: "Single choice. Provide comma-separated options.", example: "Online, Referral, Partner" },
    MULTISELECT: { hint: "Multiple choices. Provide comma-separated options.", example: "Payroll, CRM, HR" },
    CHECKBOX: { hint: "Yes/No toggle.", example: "Example: VIP customer" },
  }

  const customFieldMap = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, field])),
    [fields],
  )

  const renderCell = (contact: Contact, key: string) => {
    const base = baseColumnMap[key]
    if (base) return base.render(contact)
    return <span className="text-muted-foreground">{formatCustomFieldValue(contact.customFields?.[key])}</span>
  }

  const allColumnKeys = useMemo(
    () => [...baseColumns.map((column) => column.key), ...fields.map((field) => field.key)],
    [baseColumns, fields],
  )

  const normalizeView = (current: CrmViewSettings) => {
    const order = Array.isArray(current.order) ? [...current.order] : []
    let changed = false
    allColumnKeys.forEach((key) => {
      if (!order.includes(key)) {
        order.push(key)
        changed = true
      }
    })
    const hidden = Array.isArray(current.hidden) ? current.hidden.filter((key) => allColumnKeys.includes(key)) : []
    if (hidden.length !== (current.hidden?.length || 0)) changed = true
    return { view: { order, hidden }, changed }
  }

  useEffect(() => {
    const baseView = crmView || DEFAULT_CRM_VIEWS.contacts
    const normalized = normalizeView(baseView)
    setView(normalized.view)
    if (normalized.changed) {
      onViewChange?.(normalized.view)
    }
  }, [crmView, allColumnKeys.join("|")])

  const visibleColumns = view.order.filter(
    (key) => !view.hidden.includes(key) && allColumnKeys.includes(key),
  )

  const isEditingField = Boolean(editingFieldId)

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / pageSize))
  const pagedContacts = filteredContacts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  useEffect(() => {
    if (!timelineContact) {
      setTimelineEvents([])
      return
    }
    setTimelineEvents(buildContactTimeline(timelineContact))
  }, [timelineContact])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      const payload = { ...formData }
      if (onUpdateContact) {
        onUpdateContact(editingId, payload)
      } else {
        setContacts((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, ...payload, lastContact: c.lastContact || "Updated" } : c)),
        )
      }
    } else {
      const payload = { ...formData }
      if (onAddContact) {
        onAddContact(payload)
      } else {
        const newContact: Contact = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          status: formData.status,
          revenue: 0,
          lastContact: "Just now",
          customFields: formData.customFields,
        }
        setContacts([...contacts, newContact])
      }
    }
    setFormData({ name: "", email: "", phone: "", company: "", status: "lead", customFields: {} })
    setEditingId(null)
    setShowModal(false)
  }

  const handleDeleteContact = (id: string) => {
    if (onDeleteContact) {
      onDeleteContact(id)
    } else {
      setContacts(contacts.filter((c) => c.id !== id))
    }
  }

  const applyViewUpdate = (nextView: CrmViewSettings) => {
    setView(nextView)
    onViewChange?.(nextView)
  }

  const toggleColumn = (key: string) => {
    const hidden = new Set(view.hidden)
    if (hidden.has(key)) {
      hidden.delete(key)
    } else {
      hidden.add(key)
    }
    applyViewUpdate({ ...view, hidden: Array.from(hidden) })
  }

  const moveColumn = (key: string, direction: -1 | 1) => {
    const idx = view.order.indexOf(key)
    const nextIndex = idx + direction
    if (idx === -1 || nextIndex < 0 || nextIndex >= view.order.length) return
    const nextOrder = [...view.order]
    nextOrder.splice(idx, 1)
    nextOrder.splice(nextIndex, 0, key)
    applyViewUpdate({ ...view, order: nextOrder })
  }

  const handleCreateField = async () => {
    if (!fieldForm.name.trim()) return
    if (["SELECT", "MULTISELECT"].includes(fieldForm.type) && !normalizeOptions(fieldForm.options).length) {
      setFieldsError("Add at least one option for select fields.")
      return
    }
    try {
      setFieldsError("")
      const isEditing = Boolean(editingFieldId)
      const payload = {
        id: editingFieldId || undefined,
        name: fieldForm.name.trim(),
        entity: "contact",
        type: fieldForm.type,
        options: ["SELECT", "MULTISELECT"].includes(fieldForm.type)
          ? normalizeOptions(fieldForm.options)
          : undefined,
        required: fieldForm.required,
      }
      const res = await fetch("/api/crm/fields", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...getSessionHeaders() },
        body: JSON.stringify(payload),
      })
      if (res.status === 503) {
        const fallbackField: CrmField = {
          id: `local-${Date.now()}`,
          key: slugifyKey(fieldForm.name) || `field_${Date.now()}`,
          name: fieldForm.name.trim(),
          type: fieldForm.type,
          options: payload.options,
          required: fieldForm.required,
        }
        setFields((prev) => [...prev, fallbackField])
        if (!view.order.includes(fallbackField.key)) {
          applyViewUpdate({ ...view, order: [...view.order, fallbackField.key] })
        }
        setFieldForm({ name: "", type: "TEXT", options: "", required: false })
        setEditingFieldId(null)
        setFieldsError("Saved locally only. Connect the database to persist CRM fields.")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save field")
      const nextField = data.field as CrmField
      setFields((prev) => (isEditing ? prev.map((item) => (item.id === nextField.id ? nextField : item)) : [...prev, nextField]))
      if (!view.order.includes(nextField.key)) {
        applyViewUpdate({ ...view, order: [...view.order, nextField.key] })
      }
      setFieldForm({ name: "", type: "TEXT", options: "", required: false })
      setEditingFieldId(null)
    } catch (err: any) {
      console.warn("Failed to save field", err)
      setFieldsError(err?.message || "Failed to save field")
    }
  }

  const handleArchiveField = async (field: CrmField) => {
    try {
      const res = await fetch(`/api/crm/fields?id=${field.id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) throw new Error("Failed to archive field")
    } catch (err) {
      console.warn("Failed to archive field", err)
    } finally {
      setFields((prev) => prev.filter((item) => item.id !== field.id))
      const nextOrder = view.order.filter((key) => key !== field.key)
      const nextHidden = view.hidden.filter((key) => key !== field.key)
      applyViewUpdate({ order: nextOrder, hidden: nextHidden })
      if (editingFieldId === field.id) {
        setEditingFieldId(null)
        setFieldForm({ name: "", type: "TEXT", options: "", required: false })
      }
    }
  }

  const handleEditField = (field: CrmField) => {
    setEditingFieldId(field.id)
    setFieldForm({
      name: field.name,
      type: field.type,
      options: Array.isArray(field.options) ? field.options.join(", ") : "",
      required: Boolean(field.required),
    })
  }

  const cancelEditField = () => {
    setEditingFieldId(null)
    setFieldForm({ name: "", type: "TEXT", options: "", required: false })
  }

  const handleSeedFields = async () => {
    const existingNames = new Set(fields.map((field) => field.name.toLowerCase()))
    const toCreate = recommendedFields.filter((field) => !existingNames.has(field.name.toLowerCase()))
    if (!toCreate.length) return
    try {
      setFieldsError("")
      const created: CrmField[] = []
      for (const field of toCreate) {
        const res = await fetch("/api/crm/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({ ...field, entity: "contact" }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.field) {
          created.push(data.field)
        }
      }
      if (created.length) {
        setFields((prev) => [...prev, ...created])
        const nextOrder = [...view.order]
        created.forEach((field) => {
          if (!nextOrder.includes(field.key)) nextOrder.push(field.key)
        })
        applyViewUpdate({ ...view, order: nextOrder })
      }
    } catch (err) {
      console.warn("Failed to add recommended fields", err)
      setFieldsError("Failed to add recommended fields. Check your connection and try again.")
    }
  }

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      status: contact.status,
      customFields: contact.customFields || {},
    })
    setEditingId(contact.id)
    setShowModal(true)
  }

  const appendTimelineEvent = (event: TimelineEvent) => {
    setTimelineEvents((prev) => [event, ...prev])
  }

  const openComposer = (type: "email" | "whatsapp" | "sms") => {
    setComposerType(type)
    setComposerMessage("")
    setComposerOpen(true)
  }

  const sendMessage = () => {
    if (!timelineContact) return
    const labels = {
      email: "Email sent",
      whatsapp: "WhatsApp message sent",
      sms: "SMS sent",
    }
    const detail =
      composerMessage.trim() ||
      `Message sent to ${timelineContact.name} (${timelineContact.phone || "no phone on file"}).`
    appendTimelineEvent({
      id: `evt-${Date.now()}`,
      type: composerType,
      title: labels[composerType],
      detail,
      time: "Just now",
    })
    setComposerOpen(false)
    setComposerMessage("")
  }

  const logCall = () => {
    if (!timelineContact) return
    appendTimelineEvent({
      id: `evt-${Date.now()}`,
      type: "call",
      title: "Call logged",
      detail: `Spoke with ${timelineContact.name} about next steps.`,
      time: "Just now",
    })
  }

  const downloadContactsCSV = () => {
    const headers = visibleColumns.map((key) => baseColumnMap[key]?.label || customFieldMap[key]?.name || key)
    const rows = contacts.map((contact) =>
      visibleColumns.map((key) => {
        if (key === "name") return contact.name
        if (key === "company") return contact.company || ""
        if (key === "status") return contact.status
        if (key === "revenue") return contact.revenue || ""
        if (key === "lastContact") return contact.lastContact || ""
        return formatCustomFieldValue(contact.customFields?.[key])
      }),
    )
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "contacts.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contacts ({filteredContacts.length})</CardTitle>
            <CardDescription>View and manage all your contacts</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadContactsCSV}
              className="flex items-center gap-2 bg-transparent"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFieldDialogOpen(true)}
              className="flex items-center gap-2 bg-transparent"
            >
              <Settings2 className="w-4 h-4" />
              Fields & View
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {visibleColumns.map((key) => (
                    <th key={key} className="text-left py-3 px-4 font-medium text-muted-foreground">
                      {baseColumnMap[key]?.label || customFieldMap[key]?.name || key}
                    </th>
                  ))}
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border hover:bg-muted/50 transition">
                    {visibleColumns.map((key) => (
                      <td key={`${contact.id}-${key}`} className="py-4 px-4">
                        {renderCell(contact, key)}
                      </td>
                    ))}
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => alert(JSON.stringify(contact, null, 2))}>
                            <Eye className="w-4 h-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTimelineContact(contact)}>
                            <Activity className="w-4 h-4 mr-2" />
                            View timeline
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(contact)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteContact(contact.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
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

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fields & View Settings</DialogTitle>
            <DialogDescription>Customize the CRM table with your own fields and column layouts.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold">Add a custom field</h4>
                <p className="text-sm text-muted-foreground">
                  Capture details like date of birth, location, or lead source.
                </p>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field name</label>
                  <Input
                    value={fieldForm.name}
                    onChange={(event) => setFieldForm({ ...fieldForm, name: event.target.value })}
                    placeholder="e.g. Date of Birth"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field type</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    value={fieldForm.type}
                    onChange={(event) =>
                      setFieldForm({ ...fieldForm, type: event.target.value as CrmFieldType })
                    }
                    disabled={isEditingField}
                  >
                    <option value="TEXT">Text</option>
                    <option value="NUMBER">Number</option>
                    <option value="CURRENCY">Currency</option>
                    <option value="DATE">Date</option>
                    <option value="SELECT">Single select</option>
                    <option value="MULTISELECT">Multi select</option>
                    <option value="CHECKBOX">Checkbox</option>
                  </select>
                </div>
                {["SELECT", "MULTISELECT"].includes(fieldForm.type) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Options</label>
                    <Input
                      value={fieldForm.options}
                      onChange={(event) => setFieldForm({ ...fieldForm, options: event.target.value })}
                      placeholder="Referral, Website, Partner"
                    />
                    <p className="text-xs text-muted-foreground">
                      {fieldTypeHelp[fieldForm.type].hint} {fieldTypeHelp[fieldForm.type].example}
                    </p>
                  </div>
                )}
                {!["SELECT", "MULTISELECT"].includes(fieldForm.type) && (
                  <div className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
                    {fieldTypeHelp[fieldForm.type].hint} {fieldTypeHelp[fieldForm.type].example}
                  </div>
                )}
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Required field</p>
                    <p className="text-xs text-muted-foreground">Ask for this every time.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={fieldForm.required}
                      onCheckedChange={(checked) => setFieldForm({ ...fieldForm, required: Boolean(checked) })}
                    />
                    <span>Required</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={handleCreateField} className="flex-1 min-w-[160px]">
                    {isEditingField ? "Save field" : "Add field"}
                  </Button>
                  {isEditingField ? (
                    <Button variant="outline" className="bg-transparent" onClick={cancelEditField}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </div>

              {fieldsLoading && <p className="text-xs text-muted-foreground">Loading custom fields...</p>}
              {fieldsError && <p className="text-xs text-destructive">{fieldsError}</p>}
              {!fields.length && !fieldsLoading && (
                <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  <p>No custom fields yet.</p>
                  <Button size="sm" variant="outline" className="mt-3 bg-transparent" onClick={handleSeedFields}>
                    Add recommended fields
                  </Button>
                </div>
              )}
              {fields.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Existing fields</p>
                  <div className="space-y-2">
                    {fields.map((field) => (
                      <div key={field.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                        <div>
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-xs text-muted-foreground">{field.type.toLowerCase()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="bg-transparent" onClick={() => handleEditField(field)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleArchiveField(field)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold">Column visibility & order</h4>
                <p className="text-sm text-muted-foreground">
                  Hide columns or reorder them for your personal view.
                </p>
              </div>
              <div className="space-y-2">
                {view.order.map((key, idx) => {
                  const label = baseColumnMap[key]?.label || customFieldMap[key]?.name || key
                  const visible = !view.hidden.includes(key)
                  return (
                    <div key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Checkbox checked={visible} onCheckedChange={() => toggleColumn(key)} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveColumn(key, -1)}
                          disabled={idx === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => moveColumn(key, 1)}
                          disabled={idx === view.order.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Contact" : "Add New Contact"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as "lead" | "prospect" | "customer" })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md"
                  >
                    <option value="lead">Lead</option>
                    <option value="prospect">Prospect</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                {fields.length > 0 && (
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-semibold">Custom fields</p>
                    {fields.map((field) => (
                      <div key={field.id} className="space-y-2">
                        <label className="text-sm font-medium">{field.name}</label>
                        <CustomFieldInput
                          field={field}
                          value={formData.customFields[field.key]}
                          onChange={(value) =>
                            setFormData({
                              ...formData,
                              customFields: { ...formData.customFields, [field.key]: value },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
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
                    {editingId ? "Save Contact" : "Add Contact"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {timelineContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>Customer Timeline</CardTitle>
                <CardDescription>Every touchpoint across CRM, tasks, and finance.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTimelineContact(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-border rounded-lg p-3 bg-muted/20">
                <div>
                  <p className="font-medium">{timelineContact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {timelineContact.company || "No company"} • {timelineContact.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[timelineContact.status]}>
                    {timelineContact.status}
                  </Badge>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openComposer("email")}>
                    Send email
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openComposer("whatsapp")}>
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" className="bg-transparent" onClick={() => openComposer("sms")}>
                    SMS
                  </Button>
                  <Button size="sm" onClick={logCall}>
                    Log call
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {timelineEvents.map((event, idx) => {
                  const Icon = timelineIcons[event.type]
                  return (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${timelineStyles[event.type]}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {idx < timelineEvents.length - 1 && <div className="w-0.5 h-8 bg-border mt-2" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.detail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {composerOpen && timelineContact && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>
                  {composerType === "email" ? "Send Email" : composerType === "whatsapp" ? "Send WhatsApp" : "Send SMS"}
                </CardTitle>
                <CardDescription>
                  To {timelineContact.name} {timelineContact.phone ? `• ${timelineContact.phone}` : ""}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setComposerOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your message..."
                value={composerMessage}
                onChange={(event) => setComposerMessage(event.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setComposerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
