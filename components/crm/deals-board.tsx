"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar, Archive, Plus, Settings2, X } from "lucide-react"
import { formatNaira } from "@/lib/currency"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { getSessionHeaders } from "@/lib/user-settings"
import {
  CustomFieldInput,
  normalizeOptions,
  type CrmField,
  type CrmFieldType,
} from "@/components/crm/custom-field-input"

interface Deal {
  id: string
  title: string
  company?: string
  companyId?: string | null
  value: number
  stage: "prospect" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
  owner?: string
  ownerId?: string | null
  contactId?: string | null
  expectedClose?: string
  customFields?: Record<string, any>
}

const stages = [
  { id: "prospect", title: "Prospect", color: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "qualified", title: "Qualified", color: "bg-sky-50 dark:bg-sky-950/30" },
  { id: "proposal", title: "Proposal", color: "bg-yellow-50 dark:bg-yellow-950/30" },
  { id: "negotiation", title: "Negotiation", color: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "won", title: "Won", color: "bg-green-50 dark:bg-green-950/30" },
  { id: "lost", title: "Lost", color: "bg-red-50 dark:bg-red-950/30" },
]

const mockDeals: Deal[] = [
  {
    id: "1",
    title: "Enterprise License",
    company: "Tech Solutions Inc",
    value: 150000,
    stage: "proposal",
    owner: "John Smith",
    expectedClose: "2025-12-15",
  },
  {
    id: "2",
    title: "Service Agreement",
    company: "StartUp Labs",
    value: 75000,
    stage: "negotiation",
    owner: "Jane Doe",
    expectedClose: "2025-11-30",
  },
  {
    id: "3",
    title: "Implementation",
    company: "Enterprise Corp",
    value: 250000,
    stage: "qualified",
    owner: "John Smith",
    expectedClose: "2025-12-31",
  },
  {
    id: "4",
    title: "Renewal",
    company: "Global Industries",
    value: 125000,
    stage: "won",
    owner: "Jane Doe",
    expectedClose: "2025-10-15",
  },
]

const recommendedDealFields: Array<{ name: string; type: CrmFieldType; options?: string[] }> = [
  { name: "Probability", type: "NUMBER" },
  { name: "Forecast Category", type: "SELECT", options: ["Best Case", "Commit", "Pipeline", "Omitted"] },
  { name: "Deal Type", type: "SELECT", options: ["New Business", "Upsell", "Renewal", "Expansion"] },
  { name: "Risk Level", type: "SELECT", options: ["Low", "Medium", "High"] },
  { name: "Competitor", type: "TEXT" },
  { name: "Next Step", type: "TEXT" },
  { name: "Decision Date", type: "DATE" },
  { name: "Implementation Start", type: "DATE" },
]

type DealsBoardProps = {
  deals?: Deal[]
  onAddDeal?: (data: Omit<Deal, "id">) => void
  onUpdateDeal?: (id: string, data: Partial<Deal>) => void
}

export function DealsBoard({ deals, onAddDeal, onUpdateDeal }: DealsBoardProps) {
  const [dealList, setDealList] = useState<Deal[]>(deals && deals.length ? deals : mockDeals)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false)
  const [fields, setFields] = useState<CrmField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [fieldsError, setFieldsError] = useState("")
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [fieldForm, setFieldForm] = useState({
    name: "",
    type: "TEXT" as CrmFieldType,
    options: "",
    required: false,
  })
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    value: 0,
    stage: "prospect" as Deal["stage"],
    expectedClose: "",
    customFields: {} as Record<string, any>,
  })

  const fieldTypeHelp: Record<CrmFieldType, { hint: string; example: string }> = {
    TEXT: { hint: "Use text for labels or free-form notes.", example: "e.g. Procurement stage" },
    NUMBER: { hint: "Numbers only.", example: "e.g. 12" },
    CURRENCY: { hint: "Numeric amounts in NGN.", example: "e.g. 500000" },
    DATE: { hint: "Date format is YYYY-MM-DD.", example: "e.g. 2025-09-15" },
    SELECT: { hint: "Single choice. Provide comma-separated options.", example: "Inbound, Referral" },
    MULTISELECT: { hint: "Multiple choices. Provide comma-separated options.", example: "Security, Legal" },
    CHECKBOX: { hint: "Yes/No toggle.", example: "Example: Requires approval" },
  }

  const slugifyKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

  useEffect(() => {
    if (deals) {
      setDealList(deals.length ? deals : mockDeals)
    }
  }, [deals])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  useEffect(() => {
    const loadFields = async () => {
      try {
        setFieldsLoading(true)
        setFieldsError("")
        const res = await fetch("/api/crm/fields?entity=deal", { headers: { ...getSessionHeaders() } })
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

  const sortedDeals = [...dealList].sort((a, b) => (b.expectedClose || "").localeCompare(a.expectedClose || ""))

  const totalPages = Math.max(1, Math.ceil(sortedDeals.length / pageSize))
  const pagedDeals = sortedDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const isEditingField = Boolean(editingFieldId)

  useEffect(() => {
    setCurrentPage(1)
  }, [dealList.length])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

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
        entity: "deal",
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
        setFieldForm({ name: "", type: "TEXT", options: "", required: false })
        setEditingFieldId(null)
        setFieldsError("Saved locally only. Connect the database to persist CRM fields.")
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to save field")
      const nextField = data.field as CrmField
      setFields((prev) => (isEditing ? prev.map((item) => (item.id === nextField.id ? nextField : item)) : [...prev, nextField]))
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
    const toCreate = recommendedDealFields.filter((field) => !existingNames.has(field.name.toLowerCase()))
    if (!toCreate.length) return
    try {
      setFieldsError("")
      const created: CrmField[] = []
      for (const field of toCreate) {
        const res = await fetch("/api/crm/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({ ...field, entity: "deal" }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.field) {
          created.push(data.field)
        }
      }
      if (created.length) setFields((prev) => [...prev, ...created])
    } catch (err) {
      console.warn("Failed to add recommended fields", err)
      setFieldsError("Failed to add recommended fields. Check your connection and try again.")
    }
  }

  const handleEditDeal = (deal: Deal) => {
    setFormData({
      title: deal.title,
      company: deal.company || "",
      value: deal.value,
      stage: deal.stage,
      expectedClose: deal.expectedClose || "",
      customFields: deal.customFields || {},
    })
    setEditingId(deal.id)
    setShowModal(true)
  }

  const handleSaveDeal = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = { ...formData }
    if (editingId) {
      onUpdateDeal?.(editingId, payload)
      setDealList((prev) => prev.map((deal) => (deal.id === editingId ? { ...deal, ...payload } : deal)))
    } else {
      onAddDeal?.(payload)
      setDealList((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: payload.title,
          company: payload.company,
          value: payload.value,
          stage: payload.stage,
          expectedClose: payload.expectedClose,
          owner: "—",
          customFields: payload.customFields,
        },
      ])
    }
    setFormData({ title: "", company: "", value: 0, stage: "prospect", expectedClose: "", customFields: {} })
    setEditingId(null)
    setShowModal(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Pipeline</CardTitle>
            <CardDescription>Track deals by stage and update expected close dates.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2 bg-transparent"
              onClick={() => setFieldDialogOpen(true)}
            >
              <Settings2 className="w-4 h-4" />
              Deal Fields
            </Button>
            <Button size="sm" className="flex items-center gap-2" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              Add Deal
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageDeals = pagedDeals.filter((d) => d.stage === stage.id)
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0)

          return (
            <div key={stage.id} className={`${stage.color} rounded-lg p-4 min-h-96`}>
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-1">{stage.title}</h3>
                <p className="text-xs text-muted-foreground">{formatNaira(stageTotal, true)}</p>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-card rounded-lg p-3 border border-border hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEditDeal(deal)}
                  >
                    <p className="font-medium text-sm line-clamp-2">{deal.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{deal.company || "—"}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-primary">₦</span>
                        <span className="text-sm font-semibold text-primary">{formatNaira(deal.value, true)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {deal.expectedClose || "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Summary</CardTitle>
          <CardDescription>Total value and deal count by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageDeals = dealList.filter((d) => d.stage === stage.id)
              const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0)
              return (
                <div key={stage.id} className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{stage.title}</p>
                  <p className="text-2xl font-bold">{formatNaira(stageTotal, true)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stageDeals.length} deals</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Deal Fields</DialogTitle>
            <DialogDescription>Define the fields your team needs on every opportunity.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Field name</label>
                <Input
                  value={fieldForm.name}
                  onChange={(event) => setFieldForm({ ...fieldForm, name: event.target.value })}
                  placeholder="e.g. Probability"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Field type</label>
                <select
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  value={fieldForm.type}
                  onChange={(event) => setFieldForm({ ...fieldForm, type: event.target.value as CrmFieldType })}
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
                    placeholder="Best Case, Commit, Pipeline"
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
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Existing fields</p>
              {fields.length === 0 && <p className="text-xs text-muted-foreground">Add your first field to get started.</p>}
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
        </DialogContent>
      </Dialog>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Deal" : "Add Deal"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDeal} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Deal Title</label>
                  <Input
                    value={formData.title}
                    onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                    placeholder="Implementation plan"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    value={formData.company}
                    onChange={(event) => setFormData({ ...formData, company: event.target.value })}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Value (NGN)</label>
                  <Input
                    type="number"
                    value={formData.value}
                    onChange={(event) => setFormData({ ...formData, value: Number(event.target.value || 0) })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(event) => setFormData({ ...formData, stage: event.target.value as Deal["stage"] })}
                    className="w-full px-3 py-2 border border-border rounded-md"
                  >
                    <option value="prospect">Prospect</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Close</label>
                  <Input
                    type="date"
                    value={formData.expectedClose}
                    onChange={(event) => setFormData({ ...formData, expectedClose: event.target.value })}
                  />
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
                    {editingId ? "Save Deal" : "Add Deal"}
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
