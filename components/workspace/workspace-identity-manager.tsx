"use client"

import { ChangeEvent, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Camera,
  ExternalLink,
  ImageMinus,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getApiErrorMessage, requestJson } from "@/lib/api-client"
import {
  emitWorkspaceContextUpdated,
  getWorkspaceInitials,
  OPERATING_TEMPLATES,
  WORKSPACE_INDUSTRIES,
  type WorkspaceContextResponse,
} from "@/lib/workspace-context"
import { cn } from "@/lib/utils"

type WorkspaceIdentityManagerProps = {
  title?: string
  description?: string
  compact?: boolean
  showLaunchSummary?: boolean
  className?: string
}

const acceptedLogoMimeTypes = ["image/png", "image/jpeg", "image/webp"]
const maxLogoBytes = 3 * 1024 * 1024

type FieldErrors = Partial<
  Record<
    | "name"
    | "industry"
    | "operatingTemplate"
    | "logo"
    | "notifyEmail"
    | "legalBusinessName"
    | "businessEmail",
    string
  >
>

export function WorkspaceIdentityManager({
  title = "Company identity",
  description = "Set the real company name, operating template, launch context, and workspace logo for this organisation.",
  compact = false,
  showLaunchSummary = true,
  className,
}: WorkspaceIdentityManagerProps) {
  const [context, setContext] = useState<WorkspaceContextResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [form, setForm] = useState({
    name: "",
    industry: "",
    operatingTemplate: "",
    notifyEmail: "",
    legalBusinessName: "",
    tradingName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    taxNumber: "",
    companyRegistrationNumber: "",
    defaultInvoiceTerms: "",
    defaultInvoiceNotes: "",
    paymentInstructions: "",
  })

  const canManageIdentity = Boolean(context?.viewer.canManageIdentity)
  const initials = getWorkspaceInitials(form.name || context?.org.name)

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const payload = await requestJson<WorkspaceContextResponse>("/api/workspace/context")
      setContext(payload)
      setForm({
        name: payload.org.name || "",
        industry: payload.org.industry || "",
        operatingTemplate: payload.org.operatingTemplate || "",
        notifyEmail: payload.org.notifyEmail || "",
        legalBusinessName: payload.org.legalBusinessName || "",
        tradingName: payload.org.tradingName || "",
        businessEmail: payload.org.businessEmail || "",
        businessPhone: payload.org.businessPhone || "",
        businessAddress: payload.org.businessAddress || "",
        taxNumber: payload.org.taxNumber || "",
        companyRegistrationNumber: payload.org.companyRegistrationNumber || "",
        defaultInvoiceTerms: payload.org.defaultInvoiceTerms || "",
        defaultInvoiceNotes: payload.org.defaultInvoiceNotes || "",
        paymentInstructions: payload.org.paymentInstructions || "",
      })
      return payload
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load company identity"))
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const launchBadgeTone = useMemo(() => {
    if (!context) return "bg-muted text-muted-foreground"
    if (context.launch.mode === "live") return "bg-emerald-500/15 text-emerald-300"
    if (context.launch.mode === "restricted") return "bg-rose-500/15 text-rose-300"
    if (context.launch.mode === "launch-review") return "bg-amber-500/15 text-amber-300"
    return "bg-sky-500/15 text-sky-300"
  }, [context])

  const syncContext = (payload: WorkspaceContextResponse) => {
    setContext(payload)
    setForm({
      name: payload.org.name || "",
      industry: payload.org.industry || "",
      operatingTemplate: payload.org.operatingTemplate || "",
      notifyEmail: payload.org.notifyEmail || "",
      legalBusinessName: payload.org.legalBusinessName || "",
      tradingName: payload.org.tradingName || "",
      businessEmail: payload.org.businessEmail || "",
      businessPhone: payload.org.businessPhone || "",
      businessAddress: payload.org.businessAddress || "",
      taxNumber: payload.org.taxNumber || "",
      companyRegistrationNumber: payload.org.companyRegistrationNumber || "",
      defaultInvoiceTerms: payload.org.defaultInvoiceTerms || "",
      defaultInvoiceNotes: payload.org.defaultInvoiceNotes || "",
      paymentInstructions: payload.org.paymentInstructions || "",
    })
    emitWorkspaceContextUpdated(payload)
  }

  const validateForm = () => {
    const nextErrors: FieldErrors = {}
    if (!form.name.trim()) nextErrors.name = "Company or workspace name is required."
    if (!form.industry.trim()) nextErrors.industry = "Choose the company industry."
    if (!form.operatingTemplate.trim()) nextErrors.operatingTemplate = "Choose the primary operating template."
    if (form.notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notifyEmail)) {
      nextErrors.notifyEmail = "Shared notify email must be a valid email address."
    }
    if (!form.legalBusinessName.trim()) {
      nextErrors.legalBusinessName = "Legal business name is required for invoice and document branding."
    }
    if (form.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.businessEmail)) {
      nextErrors.businessEmail = "Business email must be a valid email address."
    }
    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSave = async () => {
    if (!canManageIdentity || !validateForm()) return
    try {
      setSaving(true)
      setError("")
      setStatus("")
      const payload = await requestJson<WorkspaceContextResponse & { message?: string }>("/api/workspace/context", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      syncContext(payload)
      setStatus(payload.message || "Company identity saved.")
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save company identity"))
    } finally {
      setSaving(false)
    }
  }

  const handleLogoSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const nextErrors: FieldErrors = {}
    if (!acceptedLogoMimeTypes.includes(file.type)) {
      nextErrors.logo = "Upload a PNG, JPG, JPEG, or WEBP logo."
    } else if (file.size > maxLogoBytes) {
      nextErrors.logo = "Logo file is too large. Max allowed size is 3MB."
    }
    setFieldErrors((current) => ({ ...current, ...nextErrors }))
    if (Object.keys(nextErrors).length > 0) return

    try {
      setUploading(true)
      setError("")
      setStatus("")
      const body = new FormData()
      body.append("file", file)
      const payload = await requestJson<{ message?: string; logoUrl?: string | null; logoPublicId?: string | null }>(
        "/api/workspace/logo",
        {
          method: "POST",
          body,
        },
      )

      const nextContext = context
        ? {
            ...context,
            org: {
              ...context.org,
              logoUrl: payload.logoUrl || null,
            },
          }
        : await load()

      if (nextContext) {
        syncContext(nextContext)
      }
      setStatus(payload.message || "Company logo uploaded.")
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to upload company logo"))
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!canManageIdentity) return
    try {
      setRemoving(true)
      setError("")
      setStatus("")
      await requestJson<{ message?: string }>("/api/workspace/logo", { method: "DELETE" })
      if (context) {
        const nextContext = {
          ...context,
          org: {
            ...context.org,
            logoUrl: null,
          },
        }
        syncContext(nextContext)
      } else {
        await load()
      }
      setStatus("Company logo removed.")
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to remove company logo"))
    } finally {
      setRemoving(false)
    }
  }

  const blockers = context?.launch.blockers || []

  return (
    <Card className={cn("border-border/70 bg-gradient-to-br from-card via-card to-muted/30", className)}>
      <CardHeader className={compact ? "pb-4" : undefined}>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-6", compact && "space-y-4")}>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-start gap-4">
                {context?.org.logoUrl ? (
                  <img
                    src={context.org.logoUrl}
                    alt={`${context.org.name} logo`}
                    className="h-16 w-16 rounded-2xl border border-border/70 object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-primary/10 text-lg font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="truncate text-lg font-semibold">{context?.org.name || form.name || "Workspace"}</p>
                    <p className="text-sm text-muted-foreground">
                      {context?.viewer.roleLabel || "Workspace member"} · {context?.launch.modeLabel || "Workspace"}
                    </p>
                  </div>
                  {showLaunchSummary ? (
                    <div className="space-y-2">
                      <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", launchBadgeTone)}>
                        {context?.launch.summary || "Loading readiness..."}
                      </span>
                      {blockers.length > 0 ? (
                        <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
                          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Primary blockers</p>
                          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {blockers.map((item) => (
                              <li key={item.id} className="truncate">
                                {item.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</p>
                <p className="mt-2 font-medium">{context?.viewer.roleLabel || "Loading..."}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Template</p>
                <p className="mt-2 font-medium">{context?.org.operatingTemplateLabel || "Not set yet"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Operating context actions</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="bg-transparent" asChild>
                  <Link href="/dashboard/setup">
                    Open Setup
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="bg-transparent" asChild>
                  <Link href="/admin/workspace">
                    Workspace settings
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                {context?.viewer.canViewFounderControls ? (
                  <Button size="sm" variant="outline" className="bg-transparent" asChild>
                    <Link href="/admin/launch-readiness">
                      Launch readiness
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="workspace-name">Company / workspace name</Label>
                <Input
                  id="workspace-name"
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, name: event.target.value }))
                    setFieldErrors((current) => ({ ...current, name: undefined }))
                  }}
                  disabled={!canManageIdentity || saving}
                  aria-invalid={fieldErrors.name ? true : undefined}
                />
                {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-industry">Industry</Label>
                <Select
                  value={form.industry}
                  onValueChange={(value) => {
                    setForm((current) => ({ ...current, industry: value }))
                    setFieldErrors((current) => ({ ...current, industry: undefined }))
                  }}
                  disabled={!canManageIdentity || saving}
                >
                  <SelectTrigger id="workspace-industry" aria-invalid={fieldErrors.industry ? true : undefined}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKSPACE_INDUSTRIES.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.industry ? <p className="text-xs text-destructive">{fieldErrors.industry}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="workspace-template">Primary operating template</Label>
                <Select
                  value={form.operatingTemplate}
                  onValueChange={(value) => {
                    setForm((current) => ({ ...current, operatingTemplate: value }))
                    setFieldErrors((current) => ({ ...current, operatingTemplate: undefined }))
                  }}
                  disabled={!canManageIdentity || saving}
                >
                  <SelectTrigger id="workspace-template" aria-invalid={fieldErrors.operatingTemplate ? true : undefined}>
                    <SelectValue placeholder="Choose operating template" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATING_TEMPLATES.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.operatingTemplate ? <p className="text-xs text-destructive">{fieldErrors.operatingTemplate}</p> : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="workspace-notify-email">Shared notify email</Label>
                <Input
                  id="workspace-notify-email"
                  type="email"
                  placeholder="ops@company.com"
                  value={form.notifyEmail}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, notifyEmail: event.target.value }))
                    setFieldErrors((current) => ({ ...current, notifyEmail: undefined }))
                  }}
                  disabled={!canManageIdentity || saving}
                  aria-invalid={fieldErrors.notifyEmail ? true : undefined}
                />
                <p className="text-xs text-muted-foreground">
                  Use a shared address for workspace alerts, invite operations, and launch follow-through.
                </p>
                {fieldErrors.notifyEmail ? <p className="text-xs text-destructive">{fieldErrors.notifyEmail}</p> : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Workspace logo</p>
                  <p className="text-sm text-muted-foreground">
                    Stored against this organisation. Refresh must keep showing the same logo.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    disabled={!canManageIdentity || uploading || removing}
                    asChild
                  >
                    <label className="cursor-pointer">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {context?.org.logoUrl ? "Replace logo" : "Upload logo"}
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoSelected}
                      />
                    </label>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => void handleRemoveLogo()}
                    disabled={!canManageIdentity || !context?.org.logoUrl || removing || uploading}
                  >
                    {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageMinus className="h-4 w-4" />}
                    Remove logo
                  </Button>
                </div>
              </div>
              {fieldErrors.logo ? <p className="mt-3 text-xs text-destructive">{fieldErrors.logo}</p> : null}
              {!canManageIdentity ? (
                <p className="mt-3 text-xs text-amber-300">
                  You can view workspace identity, but only an owner/admin-level user can edit it.
                </p>
              ) : null}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4">
              <div>
                <p className="font-medium">Document identity</p>
                <p className="text-sm text-muted-foreground">
                  This is the formal business identity used on future invoices and customer-facing finance documents.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="legal-business-name">Legal business name</Label>
                  <Input
                    id="legal-business-name"
                    value={form.legalBusinessName}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, legalBusinessName: event.target.value }))
                      setFieldErrors((current) => ({ ...current, legalBusinessName: undefined }))
                    }}
                    disabled={!canManageIdentity || saving}
                    aria-invalid={fieldErrors.legalBusinessName ? true : undefined}
                    placeholder="Acme Services Limited"
                  />
                  {fieldErrors.legalBusinessName ? <p className="text-xs text-destructive">{fieldErrors.legalBusinessName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trading-name">Trading name</Label>
                  <Input
                    id="trading-name"
                    value={form.tradingName}
                    onChange={(event) => setForm((current) => ({ ...current, tradingName: event.target.value }))}
                    disabled={!canManageIdentity || saving}
                    placeholder="Acme Field Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Business email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={form.businessEmail}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, businessEmail: event.target.value }))
                      setFieldErrors((current) => ({ ...current, businessEmail: undefined }))
                    }}
                    disabled={!canManageIdentity || saving}
                    aria-invalid={fieldErrors.businessEmail ? true : undefined}
                    placeholder="accounts@acme.com"
                  />
                  {fieldErrors.businessEmail ? <p className="text-xs text-destructive">{fieldErrors.businessEmail}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Business phone</Label>
                  <Input
                    id="business-phone"
                    value={form.businessPhone}
                    onChange={(event) => setForm((current) => ({ ...current, businessPhone: event.target.value }))}
                    disabled={!canManageIdentity || saving}
                    placeholder="+234..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-number">Tax / VAT number</Label>
                  <Input
                    id="tax-number"
                    value={form.taxNumber}
                    onChange={(event) => setForm((current) => ({ ...current, taxNumber: event.target.value }))}
                    disabled={!canManageIdentity || saving}
                    placeholder="VAT-12345"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="company-registration-number">Company registration number</Label>
                  <Input
                    id="company-registration-number"
                    value={form.companyRegistrationNumber}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, companyRegistrationNumber: event.target.value }))
                    }
                    disabled={!canManageIdentity || saving}
                    placeholder="RC 123456"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="business-address">Business address</Label>
                  <Textarea
                    id="business-address"
                    value={form.businessAddress}
                    onChange={(event) => setForm((current) => ({ ...current, businessAddress: event.target.value }))}
                    disabled={!canManageIdentity || saving}
                    rows={3}
                    placeholder="Full business address"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="default-invoice-notes">Default invoice notes</Label>
                  <Textarea
                    id="default-invoice-notes"
                    value={form.defaultInvoiceNotes}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, defaultInvoiceNotes: event.target.value }))
                    }
                    disabled={!canManageIdentity || saving}
                    rows={3}
                    placeholder="Applied to future invoices unless edited per invoice."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="default-invoice-terms">Default invoice terms</Label>
                  <Textarea
                    id="default-invoice-terms"
                    value={form.defaultInvoiceTerms}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, defaultInvoiceTerms: event.target.value }))
                    }
                    disabled={!canManageIdentity || saving}
                    rows={3}
                    placeholder="Net 15. Payment due on or before due date."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="payment-instructions">Payment instructions</Label>
                  <Textarea
                    id="payment-instructions"
                    value={form.paymentInstructions}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, paymentInstructions: event.target.value }))
                    }
                    disabled={!canManageIdentity || saving}
                    rows={3}
                    placeholder="Bank transfer details or billing contact instructions."
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Changes apply to your workspace and future documents. Already issued invoices keep the branding used when
                they were issued.
              </p>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}
            {status ? (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{status}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => void handleSave()} disabled={!canManageIdentity || saving || loading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Saving..." : "Save company identity"}
              </Button>
              {loading ? <p className="text-sm text-muted-foreground">Loading company identity...</p> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
