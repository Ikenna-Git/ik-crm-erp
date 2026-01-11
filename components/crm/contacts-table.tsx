"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus, X, Download, MoreHorizontal, Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  status: "lead" | "prospect" | "customer"
  revenue?: number
  lastContact?: string
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

type ContactsTableProps = {
  searchQuery: string
  contacts?: Contact[]
  onAddContact?: (data: Omit<Contact, "id" | "status" | "revenue" | "lastContact"> & { status: Contact["status"] }) => void
  onDeleteContact?: (id: string) => void
  onUpdateContact?: (id: string, data: Partial<Contact>) => void
}

export function ContactsTable({
  searchQuery,
  contacts: providedContacts,
  onAddContact,
  onDeleteContact,
  onUpdateContact,
}: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>(providedContacts || mockContacts)
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "lead" as const,
  })

  useEffect(() => {
    if (providedContacts) {
      setContacts(providedContacts)
    }
  }, [providedContacts])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.company || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE))
  const pagedContacts = filteredContacts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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
        }
        setContacts([...contacts, newContact])
      }
    }
    setFormData({ name: "", email: "", phone: "", company: "", status: "lead" })
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

  const handleEdit = (contact: Contact) => {
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone || "",
      company: contact.company || "",
      status: contact.status,
    })
    setEditingId(contact.id)
    setShowModal(true)
  }

  const downloadContactsCSV = () => {
    const headers = ["Name", "Email", "Phone", "Company", "Status", "Revenue", "Last Contact"]
    const rows = contacts.map((c) => [c.name, c.email, c.phone, c.company, c.status, c.revenue, c.lastContact])
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
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-border hover:bg-muted/50 transition">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">{contact.company}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[contact.status]}`}
                      >
                        {contact.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">{contact.revenue > 0 ? formatNaira(contact.revenue) : "—"}</td>
                    <td className="py-4 px-4 text-muted-foreground">{contact.lastContact}</td>
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
            />
          </div>
        </CardContent>
      </Card>

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
    </div>
  )
}
