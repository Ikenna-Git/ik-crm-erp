"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PaginationControls } from "@/components/shared/pagination-controls"
import { RecordDetailsDialog } from "@/components/shared/record-details-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckSquare, Download, Edit, Eye, ExternalLink, Lock, MoreHorizontal, Plus, Trash2, X } from "lucide-react"
import type { WorkspaceDocumentIdentity } from "@/lib/workspace-context"

type InvoiceLineItem = { description?: string; quantity?: number; unitPrice?: number; amount?: number }
type InvoiceLink = { label?: string; url: string }
type InvoiceRelatedRecord = { id?: string; label?: string }
type InvoiceRelations = {
  company?: InvoiceRelatedRecord | null
  deal?: InvoiceRelatedRecord | null
  project?: InvoiceRelatedRecord | null
}

export interface Invoice {
  id: string
  number: string
  client: string
  amount: number
  notes?: string
  terms?: string
  lineItems?: InvoiceLineItem[]
  relatedLinks?: InvoiceLink[]
  relatedRecords?: InvoiceRelations
  status: "draft" | "sent" | "paid" | "overdue"
  approvalStatus?: "pending" | "approved" | "rejected" | null
  date?: string
  dueDate?: string
  documentIdentity?: WorkspaceDocumentIdentity | null
}

type RelationOption = { id: string; label: string }

const statusColors = {
  paid: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/40",
  sent: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40",
  draft: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-500/40",
  overdue: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-500/40",
  approved: "bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-200 dark:border-green-500/40",
  rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40",
}

const invoiceClients = ["Acme Corp", "Northwind", "Globex", "Venture Labs", "Nimbus", "Zenith"]
const statusOptions: Invoice["status"][] = ["draft", "sent", "paid", "overdue"]

const buildMockInvoices = (count: number): Invoice[] =>
  Array.from({ length: count }, (_, idx) => ({
    id: `INV-${(idx + 1).toString().padStart(3, "0")}`,
    number: `INV-2025-${(idx + 1).toString().padStart(3, "0")}`,
    client: invoiceClients[idx % invoiceClients.length],
    amount: 85000 + (idx % 8) * 60000,
    status: statusOptions[idx % statusOptions.length],
    date: new Date(2025, idx % 12, (idx % 27) + 1).toISOString().slice(0, 10),
    dueDate: new Date(2025, idx % 12, (idx % 27) + 10).toISOString().slice(0, 10),
  }))

const mockInvoices: Invoice[] = buildMockInvoices(70)

type Props = {
  searchQuery: string
  invoices?: Invoice[]
  crmCompanies?: RelationOption[]
  crmDeals?: RelationOption[]
  projects?: RelationOption[]
  onAddInvoice?: (data: Omit<Invoice, "id">) => void
  onUpdateInvoice?: (id: string, data: Partial<Invoice>) => void
  onDeleteInvoice?: (id: string) => void
  onRequestApproval?: (invoice: Invoice) => Promise<void> | void
  showAmounts?: boolean
  canManage?: boolean
  privacyUnlocked?: boolean
  documentIdentity?: WorkspaceDocumentIdentity | null
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(amount * 805)

const safeSearchValue = (value: unknown) => (typeof value === "string" ? value : "").toLowerCase()
const safeAmount = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const emptyFormData = {
  number: "",
  client: "",
  amount: "",
  date: "",
  dueDate: "",
  notes: "",
  terms: "",
  linkedCompanyId: "__none__",
  linkedDealId: "__none__",
  linkedProjectId: "__none__",
  lineItems: [{ description: "", quantity: "1", unitPrice: "0" }],
  relatedLinks: [{ label: "", url: "" }],
}

const getApprovalActionState = (invoice: Invoice) => {
  if (invoice.approvalStatus === "pending") return { disabled: true, label: "Approval pending" }
  if (invoice.approvalStatus === "approved") return { disabled: true, label: "Already approved" }
  if (invoice.approvalStatus === "rejected") return { disabled: true, label: "Resubmit not implemented" }
  return { disabled: false, label: "Request approval" }
}

const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const buildRelation = (id: string, options: RelationOption[]) => {
  if (!id || id === "__none__") return null
  const option = options.find((item) => item.id === id)
  return { id, label: option?.label || id }
}

export function InvoicesTable({
  searchQuery,
  invoices: providedInvoices,
  crmCompanies = [],
  crmDeals = [],
  projects = [],
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onRequestApproval,
  showAmounts = true,
  canManage = false,
  privacyUnlocked = false,
  documentIdentity = null,
}: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>(providedInvoices ?? [])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [editorError, setEditorError] = useState("")
  const [formData, setFormData] = useState(emptyFormData)

  useEffect(() => {
    if (providedInvoices) setInvoices(providedInvoices)
  }, [providedInvoices])

  const revealSensitive = canManage && privacyUnlocked

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const filteredInvoices = invoices.filter(
    (invoice) =>
      safeSearchValue(invoice.number).includes(searchQuery.toLowerCase()) ||
      safeSearchValue(invoice.client).includes(searchQuery.toLowerCase()) ||
      safeSearchValue(invoice.relatedRecords?.project?.label).includes(searchQuery.toLowerCase()) ||
      safeSearchValue(invoice.relatedRecords?.deal?.label).includes(searchQuery.toLowerCase()),
  )

  const sortedInvoices = [...filteredInvoices].sort((a, b) =>
    (b.date || b.dueDate || "").localeCompare(a.date || a.dueDate || ""),
  )

  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / pageSize))
  const pagedInvoices = sortedInvoices.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const stats = {
    paid: invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + safeAmount(invoice.amount), 0),
    pending: invoices
      .filter((invoice) => invoice.approvalStatus === "pending" || invoice.status === "sent")
      .reduce((sum, invoice) => sum + safeAmount(invoice.amount), 0),
    overdue: invoices.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + safeAmount(invoice.amount), 0),
  }

  const openEditor = (invoice?: Invoice) => {
    setEditorError("")
    if (!invoice) {
      setEditingId(null)
      setFormData({
        ...emptyFormData,
        notes: documentIdentity?.defaultInvoiceNotes || "",
        terms: documentIdentity?.defaultInvoiceTerms || "",
      })
      setShowModal(true)
      return
    }

    setEditingId(invoice.id)
    setFormData({
      number: invoice.number,
      client: invoice.client,
      amount: String(invoice.amount),
      date: invoice.date || "",
      dueDate: invoice.dueDate || "",
      notes: invoice.notes || "",
      terms: invoice.terms || "",
      linkedCompanyId: invoice.relatedRecords?.company?.id || "__none__",
      linkedDealId: invoice.relatedRecords?.deal?.id || "__none__",
      linkedProjectId: invoice.relatedRecords?.project?.id || "__none__",
      lineItems: invoice.lineItems?.length
        ? invoice.lineItems.map((item) => ({
            description: item.description || "",
            quantity: String(item.quantity ?? 1),
            unitPrice: String(item.unitPrice ?? item.amount ?? 0),
          }))
        : [{ description: "", quantity: "1", unitPrice: "0" }],
      relatedLinks: invoice.relatedLinks?.length
        ? invoice.relatedLinks.map((item) => ({ label: item.label || "", url: item.url || "" }))
        : [{ label: "", url: "" }],
    })
    setShowModal(true)
  }

  const normalizeLineItems = () => {
    const items = formData.lineItems
      .map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      }))
      .filter((item) => item.description || item.quantity || item.unitPrice)

    const invalid = items.find((item) => item.quantity < 0 || item.unitPrice < 0)
    if (invalid) throw new Error("Invoice line items cannot use negative quantity or unit price.")

    return items.map((item) => ({
      description: item.description || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }))
  }

  const normalizeRelatedLinks = () => {
    const items = formData.relatedLinks
      .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
      .filter((item) => item.label || item.url)

    const invalid = items.find((item) => item.url && !isSafeHttpUrl(item.url))
    if (invalid) throw new Error("Related invoice links must use a valid http or https URL.")

    return items.filter((item) => item.url).map((item) => ({ label: item.label || undefined, url: item.url }))
  }

  const handleAddInvoice = (event: React.FormEvent) => {
    event.preventDefault()
    setEditorError("")

    try {
      const lineItems = normalizeLineItems()
      const payload: Omit<Invoice, "id"> = {
        number: formData.number.trim(),
        client: formData.client.trim(),
        amount: safeAmount(Number.parseFloat(formData.amount)),
        status: (editingId ? invoices.find((item) => item.id === editingId)?.status : undefined) || "draft",
        date: formData.date,
        dueDate: formData.dueDate,
        notes: formData.notes.trim() || undefined,
        terms: formData.terms.trim() || undefined,
        lineItems,
        relatedLinks: normalizeRelatedLinks(),
        relatedRecords: {
          company: buildRelation(formData.linkedCompanyId, crmCompanies),
          deal: buildRelation(formData.linkedDealId, crmDeals),
          project: buildRelation(formData.linkedProjectId, projects),
        },
      }

      if (editingId) {
        if (onUpdateInvoice) onUpdateInvoice(editingId, payload)
        else setInvoices((prev) => prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item)))
        setEditingId(null)
      } else if (onAddInvoice) {
        onAddInvoice(payload)
      } else {
        setInvoices((prev) => [...prev, { id: Date.now().toString(), ...payload }])
      }

      setFormData(emptyFormData)
      setShowModal(false)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Failed to validate invoice details")
    }
  }

  const handleDeleteInvoice = (id: string) => {
    if (!revealSensitive) return
    if (onDeleteInvoice) onDeleteInvoice(id)
    else setInvoices(invoices.filter((invoice) => invoice.id !== id))
  }

  const downloadInvoicesCSV = () => {
    const headers = ["Invoice", "Client", "Amount", "Status", "Due Date"]
    const rows = invoices.map((invoice) => [invoice.number, invoice.client, safeAmount(invoice.amount), invoice.status, invoice.dueDate])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "invoices.csv"
    anchor.click()
  }

  const requestApproval = (invoice: Invoice) => {
    onRequestApproval?.(invoice)
  }

  const updateLineItem = (index: number, field: "description" | "quantity" | "unitPrice", value: string) => {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeLineItem = (index: number) => {
    setFormData((current) => ({
      ...current,
      lineItems: current.lineItems.filter((_, itemIndex) => itemIndex !== index).length
        ? current.lineItems.filter((_, itemIndex) => itemIndex !== index)
        : [{ description: "", quantity: "1", unitPrice: "0" }],
    }))
  }

  const updateRelatedLink = (index: number, field: "label" | "url", value: string) => {
    setFormData((current) => ({
      ...current,
      relatedLinks: current.relatedLinks.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  const removeRelatedLink = (index: number) => {
    setFormData((current) => ({
      ...current,
      relatedLinks: current.relatedLinks.filter((_, itemIndex) => itemIndex !== index).length
        ? current.relatedLinks.filter((_, itemIndex) => itemIndex !== index)
        : [{ label: "", url: "" }],
    }))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-primary">{showAmounts ? formatNaira(stats.paid) : "••••"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-accent">{showAmounts ? formatNaira(stats.pending) : "••••"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{showAmounts ? formatNaira(stats.overdue) : "••••"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices ({filteredInvoices.length})</CardTitle>
            <CardDescription>Customer invoices with document context, linked work, and approval state.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-transparent" onClick={downloadInvoicesCSV} disabled={!revealSensitive}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => openEditor()} className="flex items-center gap-2" disabled={!revealSensitive}>
              <Plus className="h-4 w-4" />
              Add Invoice
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Invoice</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Linked work</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedInvoices.map((invoice) => {
                  const displayStatus = invoice.approvalStatus || invoice.status
                  const approvalAction = getApprovalActionState(invoice)
                  return (
                    <tr key={invoice.id} className="border-b border-border transition hover:bg-muted/50">
                      <td className="px-4 py-4 font-medium">{invoice.number}</td>
                      <td className="px-4 py-4">{invoice.client}</td>
                      <td className="px-4 py-4 font-semibold">{showAmounts ? formatNaira(invoice.amount) : "••••"}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className={statusColors[displayStatus]}>
                          {displayStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {invoice.relatedRecords?.project?.label || invoice.relatedRecords?.deal?.label || invoice.relatedRecords?.company?.label || "—"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{invoice.dueDate || "—"}</td>
                      <td className="px-4 py-4">
                        {revealSensitive ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-2">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditor(invoice)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadInvoicesCSV()}>
                                <Download className="mr-2 h-4 w-4" />
                                Download CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled={approvalAction.disabled} onClick={() => requestApproval(invoice)}>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                {approvalAction.label}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteInvoice(invoice.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => setSelectedInvoice(invoice)}
                            aria-label={canManage ? "Unlock Accounting privacy to view protected invoice details" : "This invoice record is protected"}
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
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

      <RecordDetailsDialog
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => {
          if (!open) setSelectedInvoice(null)
        }}
        title={selectedInvoice?.number || "Invoice details"}
        description="Review invoice metadata, linked records, and document links in a readable panel."
        headerContent={
          revealSensitive && selectedInvoice ? (
            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start gap-4">
                {selectedInvoice.documentIdentity?.logoUrl ? (
                  <img
                    src={selectedInvoice.documentIdentity.logoUrl}
                    alt={`${selectedInvoice.documentIdentity.legalBusinessName || selectedInvoice.documentIdentity.workspaceDisplayName || "Business"} logo`}
                    className="h-14 w-14 rounded-2xl border border-border/70 object-cover"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">
                    {selectedInvoice.documentIdentity?.legalBusinessName ||
                      selectedInvoice.documentIdentity?.workspaceDisplayName ||
                      "Business identity not configured"}
                  </p>
                  {selectedInvoice.documentIdentity?.tradingName ? (
                    <p className="text-sm text-muted-foreground">Trading as {selectedInvoice.documentIdentity.tradingName}</p>
                  ) : null}
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    {selectedInvoice.documentIdentity?.businessEmail ? <p>{selectedInvoice.documentIdentity.businessEmail}</p> : null}
                    {selectedInvoice.documentIdentity?.businessPhone ? <p>{selectedInvoice.documentIdentity.businessPhone}</p> : null}
                    {selectedInvoice.documentIdentity?.businessAddress ? <p className="sm:col-span-2">{selectedInvoice.documentIdentity.businessAddress}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
        locked={!revealSensitive}
        lockedTitle="Accounting privacy locked"
        lockedDescription={
          canManage
            ? "This record is protected. Unlock Accounting privacy to view invoice details."
            : "This record is protected. An authorized finance manager must unlock Accounting privacy to view invoice details."
        }
        sections={
          revealSensitive && selectedInvoice
            ? [
                {
                  title: "Invoice summary",
                  fields: [
                    { label: "Invoice number", value: selectedInvoice.number },
                    { label: "Client", value: selectedInvoice.client },
                    { label: "Amount", value: formatNaira(selectedInvoice.amount) },
                    { label: "Status", value: selectedInvoice.status },
                    { label: "Approval", value: selectedInvoice.approvalStatus || "Not requested" },
                    { label: "Invoice date", value: selectedInvoice.date || "—" },
                    { label: "Due date", value: selectedInvoice.dueDate || "—" },
                    {
                      label: "Business name",
                      value:
                        selectedInvoice.documentIdentity?.legalBusinessName ||
                        selectedInvoice.documentIdentity?.workspaceDisplayName ||
                        "Not configured",
                    },
                    { label: "Notes", value: selectedInvoice.notes || "—" },
                    { label: "Terms", value: selectedInvoice.terms || "—" },
                  ],
                },
                {
                  title: "Linked CRM and delivery records",
                  fields: [
                    { label: "Company", value: selectedInvoice.relatedRecords?.company?.label || "No linked company" },
                    { label: "Deal", value: selectedInvoice.relatedRecords?.deal?.label || "No linked deal" },
                    { label: "Project", value: selectedInvoice.relatedRecords?.project?.label || "No linked project" },
                    {
                      label: "Open linked workflow",
                      value: selectedInvoice.relatedRecords?.project?.label
                        ? `Project: ${selectedInvoice.relatedRecords.project.label}`
                        : selectedInvoice.relatedRecords?.deal?.label
                          ? `Deal: ${selectedInvoice.relatedRecords.deal.label}`
                          : "Link a deal or project from Edit Invoice to show downstream workflow context",
                    },
                  ],
                },
                {
                  title: "Line items and supporting links",
                  fields: [
                    {
                      label: "Line items",
                      value:
                        selectedInvoice.lineItems?.length
                          ? selectedInvoice.lineItems
                              .map((item, index) => {
                                const lineAmount = item.amount ?? safeAmount(item.quantity) * safeAmount(item.unitPrice)
                                return `${item.description || `Line ${index + 1}`} (${safeAmount(item.quantity)} × ${formatNaira(safeAmount(item.unitPrice))} = ${formatNaira(lineAmount)})`
                              })
                              .join(", ")
                          : "No line items recorded yet",
                    },
                    {
                      label: "Related links",
                      value:
                        selectedInvoice.relatedLinks?.length
                          ? selectedInvoice.relatedLinks.map((item) => item.label || item.url).join(", ")
                          : "No related links recorded",
                    },
                    {
                      label: "Payment instructions",
                      value: selectedInvoice.documentIdentity?.paymentInstructions || "Not configured for this invoice",
                    },
                  ],
                },
              ]
            : []
        }
        footer={
          selectedInvoice && revealSensitive ? (
            <div className="flex flex-wrap gap-2">
              {selectedInvoice.relatedRecords?.project?.id ? (
                <Button asChild size="sm" variant="outline" className="bg-transparent">
                  <Link href="/dashboard/projects">
                    Open linked project
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button size="sm" onClick={() => openEditor(selectedInvoice)}>
                Edit invoice document
              </Button>
            </div>
          ) : null
        }
      />

      {showModal && revealSensitive ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-5xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Invoice" : "Add New Invoice"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddInvoice} className="space-y-4">
                {editorError ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{editorError}</p> : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Invoice Number</Label>
                    <Input value={formData.number} onChange={(event) => setFormData({ ...formData, number: event.target.value })} placeholder="INV-2025-001" required />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Client</Label>
                    <Input value={formData.client} onChange={(event) => setFormData({ ...formData, client: event.target.value })} placeholder="Client name" required />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Amount</Label>
                    <Input type="number" value={formData.amount} onChange={(event) => setFormData({ ...formData, amount: event.target.value })} placeholder="e.g., 500000" required />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Invoice Date</Label>
                    <Input type="date" value={formData.date} onChange={(event) => setFormData({ ...formData, date: event.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <Input type="date" value={formData.dueDate} onChange={(event) => setFormData({ ...formData, dueDate: event.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Linked company</Label>
                    <select
                      value={formData.linkedCompanyId}
                      onChange={(event) => setFormData({ ...formData, linkedCompanyId: event.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="__none__">No linked company</option>
                      {crmCompanies.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Linked deal</Label>
                    <select
                      value={formData.linkedDealId}
                      onChange={(event) => setFormData({ ...formData, linkedDealId: event.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="__none__">No linked deal</option>
                      {crmDeals.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Linked project</Label>
                    <select
                      value={formData.linkedProjectId}
                      onChange={(event) => setFormData({ ...formData, linkedProjectId: event.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2"
                    >
                      <option value="__none__">No linked project</option>
                      {projects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <p className="text-sm font-medium">Invoice branding preview</p>
                      <p className="mt-2 text-lg font-semibold">
                        {documentIdentity?.legalBusinessName || documentIdentity?.workspaceDisplayName || "Set legal business name first"}
                      </p>
                      {documentIdentity?.tradingName ? (
                        <p className="text-sm text-muted-foreground">Trading as {documentIdentity.tradingName}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted-foreground">
                        New or draft invoices use the latest document identity. Already issued invoices keep the identity snapshot used when they were issued.
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Invoice notes</Label>
                    <Textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} rows={3} placeholder="Internal note or customer-facing context." />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Payment terms</Label>
                    <Textarea value={formData.terms} onChange={(event) => setFormData({ ...formData, terms: event.target.value })} rows={3} placeholder="Net 15, milestone terms, delivery dependency, etc." />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Line items</h4>
                      <p className="text-xs text-muted-foreground">Invoice status should survive refresh because line items are persisted, not browser-only.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => setFormData((current) => ({ ...current, lineItems: [...current.lineItems, { description: "", quantity: "1", unitPrice: "0" }] }))}>
                      Add line
                    </Button>
                  </div>
                  {formData.lineItems.map((item, index) => (
                    <div key={`line-${index}`} className="grid gap-3 rounded-xl border border-border/60 p-3 md:grid-cols-[1.6fr_0.7fr_0.8fr_auto]">
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input value={item.description} onChange={(event) => updateLineItem(index, "description", event.target.value)} placeholder="Implementation milestone" />
                      </div>
                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input type="number" value={item.quantity} onChange={(event) => updateLineItem(index, "quantity", event.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">Unit price</Label>
                        <Input type="number" value={item.unitPrice} onChange={(event) => updateLineItem(index, "unitPrice", event.target.value)} />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLineItem(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Related links</h4>
                      <p className="text-xs text-muted-foreground">Attach proposal docs, sign-off pages, deployment proof, or portal pages using safe URLs only.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => setFormData((current) => ({ ...current, relatedLinks: [...current.relatedLinks, { label: "", url: "" }] }))}>
                      Add link
                    </Button>
                  </div>
                  {formData.relatedLinks.map((item, index) => (
                    <div key={`link-${index}`} className="grid gap-3 rounded-xl border border-border/60 p-3 md:grid-cols-[1fr_1.4fr_auto]">
                      <div>
                        <Label className="text-xs">Label</Label>
                        <Input value={item.label} onChange={(event) => updateRelatedLink(index, "label", event.target.value)} placeholder="Contract document" />
                      </div>
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input value={item.url} onChange={(event) => updateRelatedLink(index, "url", event.target.value)} placeholder="https://..." />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRelatedLink(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1 bg-transparent" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingId ? "Save Changes" : "Add Invoice"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
