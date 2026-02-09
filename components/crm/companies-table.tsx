"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Archive,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  MoreHorizontal,
  Plus,
  Settings2,
  Trash2,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { PaginationControls } from "@/components/shared/pagination-controls"
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

interface Company {
  id: string
  name: string
  industry?: string
  size?: string
  owner?: string
  updatedAt?: string
  customFields?: Record<string, any>
}

const recommendedFields: Array<{ name: string; type: CrmFieldType; options?: string[] }> = [
  { name: "HQ Location", type: "TEXT" },
  { name: "State", type: "TEXT" },
  { name: "Country", type: "TEXT" },
  { name: "Employees", type: "NUMBER" },
  { name: "Annual Revenue", type: "CURRENCY" },
  { name: "Founded", type: "DATE" },
  { name: "Renewal Date", type: "DATE" },
  { name: "Account Tier", type: "SELECT", options: ["Starter", "Growth", "Enterprise", "Strategic"] },
  { name: "Primary Region", type: "SELECT", options: ["West Africa", "East Africa", "Southern Africa", "Global"] },
  { name: "Website", type: "TEXT" },
]

type CompaniesTableProps = {
  companies?: Company[]
  onAddCompany?: (data: Omit<Company, "id">) => void
  onDeleteCompany?: (id: string) => void
  onUpdateCompany?: (id: string, data: Partial<Company>) => void
  crmView?: CrmViewSettings
  onViewChange?: (view: CrmViewSettings) => void
}

export function CompaniesTable({
  companies: providedCompanies,
  onAddCompany,
  onDeleteCompany,
  onUpdateCompany,
  crmView,
  onViewChange,
}: CompaniesTableProps) {
  const [companies, setCompanies] = useState<Company[]>(providedCompanies || [])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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
  const [view, setView] = useState<CrmViewSettings>(crmView || DEFAULT_CRM_VIEWS.companies)
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    size: "",
    customFields: {} as Record<string, any>,
  })

  useEffect(() => {
    if (providedCompanies) setCompanies(providedCompanies)
  }, [providedCompanies])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize])

  useEffect(() => {
    const loadFields = async () => {
      try {
        setFieldsLoading(true)
        setFieldsError("")
        const res = await fetch("/api/crm/fields?entity=company", { headers: { ...getSessionHeaders() } })
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

  const baseColumns = useMemo(
    () => [
      { key: "name", label: "Company", render: (company: Company) => company.name },
      { key: "industry", label: "Industry", render: (company: Company) => company.industry || "—" },
      { key: "size", label: "Size", render: (company: Company) => company.size || "—" },
      { key: "owner", label: "Owner", render: (company: Company) => company.owner || "—" },
      { key: "updatedAt", label: "Last Updated", render: (company: Company) => company.updatedAt || "—" },
    ],
    [],
  )

  const baseColumnMap = useMemo(
    () => Object.fromEntries(baseColumns.map((column) => [column.key, column])),
    [baseColumns],
  )

  const fieldTypeHelp: Record<CrmFieldType, { hint: string; example: string }> = {
    TEXT: { hint: "Use text for names, regions, or notes.", example: "e.g. Abuja" },
    NUMBER: { hint: "Numbers only.", example: "e.g. 250" },
    CURRENCY: { hint: "Numeric amounts in NGN.", example: "e.g. 1500000" },
    DATE: { hint: "Date format is YYYY-MM-DD.", example: "e.g. 2025-06-01" },
    SELECT: { hint: "Single choice. Provide comma-separated options.", example: "Tier 1, Tier 2" },
    MULTISELECT: { hint: "Multiple choices. Provide comma-separated options.", example: "Retail, Logistics" },
    CHECKBOX: { hint: "Yes/No toggle.", example: "Example: Strategic account" },
  }

  const slugifyKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")

  const customFieldMap = useMemo(
    () => Object.fromEntries(fields.map((field) => [field.key, field])),
    [fields],
  )

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
    const baseView = crmView || DEFAULT_CRM_VIEWS.companies
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

  const totalPages = Math.max(1, Math.ceil(companies.length / pageSize))
  const pagedCompanies = companies.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const applyViewUpdate = (nextView: CrmViewSettings) => {
    setView(nextView)
    onViewChange?.(nextView)
  }

  const toggleColumn = (key: string) => {
    const hidden = new Set(view.hidden)
    if (hidden.has(key)) hidden.delete(key)
    else hidden.add(key)
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
        entity: "company",
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
          body: JSON.stringify({ ...field, entity: "company" }),
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

  const handleEdit = (company: Company) => {
    setFormData({
      name: company.name,
      industry: company.industry || "",
      size: company.size || "",
      customFields: company.customFields || {},
    })
    setEditingId(company.id)
    setShowModal(true)
  }

  const handleSaveCompany = (event: React.FormEvent) => {
    event.preventDefault()
    const payload = { ...formData }
    if (editingId) {
      onUpdateCompany?.(editingId, payload)
      setCompanies((prev) => prev.map((company) => (company.id === editingId ? { ...company, ...payload } : company)))
    } else {
      onAddCompany?.(payload)
      setCompanies((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: payload.name,
          industry: payload.industry,
          size: payload.size,
          owner: "—",
          updatedAt: new Date().toISOString().slice(0, 10),
          customFields: payload.customFields,
        },
      ])
    }
    setFormData({ name: "", industry: "", size: "", customFields: {} })
    setEditingId(null)
    setShowModal(false)
  }

  const handleDeleteCompany = (id: string) => {
    if (onDeleteCompany) onDeleteCompany(id)
    setCompanies((prev) => prev.filter((company) => company.id !== id))
  }

  const downloadCompaniesCSV = () => {
    const headers = visibleColumns.map((key) => baseColumnMap[key]?.label || customFieldMap[key]?.name || key)
    const rows = companies.map((company) =>
      visibleColumns.map((key) => {
        if (key === "name") return company.name
        if (key === "industry") return company.industry || ""
        if (key === "size") return company.size || ""
        if (key === "owner") return company.owner || ""
        if (key === "updatedAt") return company.updatedAt || ""
        return formatCustomFieldValue(company.customFields?.[key])
      }),
    )
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "companies.csv"
    a.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Companies ({companies.length})</CardTitle>
            <CardDescription>Track accounts, industries, and relationships</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadCompaniesCSV}
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
              Add Company
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
                {pagedCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-border hover:bg-muted/50 transition">
                    {visibleColumns.map((key) => (
                      <td key={`${company.id}-${key}`} className="py-4 px-4">
                        {baseColumnMap[key]
                          ? baseColumnMap[key].render(company)
                          : formatCustomFieldValue(company.customFields?.[key])}
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
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteCompany(company.id)}
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
            <DialogDescription>Customize the companies table for your team.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-semibold">Add a custom field</h4>
                <p className="text-sm text-muted-foreground">Capture headquarters, account tier, or size.</p>
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Field name</label>
                  <Input
                    value={fieldForm.name}
                    onChange={(event) => setFieldForm({ ...fieldForm, name: event.target.value })}
                    placeholder="e.g. HQ Location"
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
                      placeholder="Startup, Growth, Enterprise"
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
                <p className="text-sm text-muted-foreground">Hide columns or reorder them.</p>
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>{editingId ? "Edit Company" : "Add Company"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveCompany} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    placeholder="Company name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Input
                    value={formData.industry}
                    onChange={(event) => setFormData({ ...formData, industry: event.target.value })}
                    placeholder="Industry"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Company Size</label>
                  <Input
                    value={formData.size}
                    onChange={(event) => setFormData({ ...formData, size: event.target.value })}
                    placeholder="e.g. 51-200"
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
                    {editingId ? "Save Company" : "Add Company"}
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
