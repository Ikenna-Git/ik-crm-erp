"use client"

import { useEffect, useState } from "react"
import { CreditCard, ShieldCheck, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type BillingResponse = {
  org: {
    id: string
    name: string
    billingPlan: string
    billingStatus: string
    billingCycle: string
    billingEmail: string
    seatLimit: number
    nextBillingDate?: string | null
    trialEndsAt?: string | null
    paymentProvider: string
    paymentCustomerRef: string
    paymentSubscriptionRef: string
  }
  summary: {
    seatsUsed: number
    seatsRemaining: number
    privilegedUserCount: number
  }
  permissions: {
    canManageBilling: boolean
    canEditProviderRefs: boolean
    isPlatformSuperAdmin: boolean
  }
  options: {
    plans: Array<{ value: string; label: string }>
    statuses: Array<{ value: string; label: string }>
    cycles: Array<{ value: string; label: string }>
  }
  providerReadiness: {
    paystack: boolean
    flutterwave: boolean
    stripe: boolean
  }
}

const formatDateInput = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : "")

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState({
    billingEmail: "",
    billingPlan: "trial",
    billingStatus: "trial",
    billingCycle: "monthly",
    seatLimit: "5",
    nextBillingDate: "",
    trialEndsAt: "",
    paymentProvider: "",
    paymentCustomerRef: "",
    paymentSubscriptionRef: "",
  })

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const response = await fetch("/api/admin/billing")
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Failed to load billing")
        setData(payload)
        setForm({
          billingEmail: payload.org.billingEmail || "",
          billingPlan: payload.org.billingPlan || "trial",
          billingStatus: payload.org.billingStatus || "trial",
          billingCycle: payload.org.billingCycle || "monthly",
          seatLimit: String(payload.org.seatLimit || 5),
          nextBillingDate: formatDateInput(payload.org.nextBillingDate),
          trialEndsAt: formatDateInput(payload.org.trialEndsAt),
          paymentProvider: payload.org.paymentProvider || "",
          paymentCustomerRef: payload.org.paymentCustomerRef || "",
          paymentSubscriptionRef: payload.org.paymentSubscriptionRef || "",
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSave = async () => {
    if (!data?.permissions.canManageBilling) return
    try {
      setSaving(true)
      setError("")
      setSuccess("")
      const response = await fetch("/api/admin/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload?.error || "Failed to update billing")
      setData((current) => (current ? { ...current, org: payload.org } : current))
      setSuccess("Billing controls saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update billing")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-300">Loading billing controls...</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Billing and subscription</CardTitle>
          <CardDescription className="text-slate-400">
            Org owners manage billing contacts for their workspace. Platform super-admin keeps provider wiring and plan
            internals under control.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Billing email</Label>
              <Input
                value={form.billingEmail}
                onChange={(event) => setForm((current) => ({ ...current, billingEmail: event.target.value }))}
                placeholder="billing@company.com"
                disabled={!data?.permissions.canManageBilling}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={form.billingPlan}
                  onValueChange={(value) => setForm((current) => ({ ...current, billingPlan: value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.options.plans.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.billingStatus}
                  onValueChange={(value) => setForm((current) => ({ ...current, billingStatus: value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.options.statuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Billing cycle</Label>
                <Select
                  value={form.billingCycle}
                  onValueChange={(value) => setForm((current) => ({ ...current, billingCycle: value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.options.cycles.map((cycle) => (
                      <SelectItem key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Seat limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.seatLimit}
                  onChange={(event) => setForm((current) => ({ ...current, seatLimit: event.target.value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                />
              </div>

              <div className="space-y-2">
                <Label>Next billing date</Label>
                <Input
                  type="date"
                  value={form.nextBillingDate}
                  onChange={(event) => setForm((current) => ({ ...current, nextBillingDate: event.target.value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                />
              </div>

              <div className="space-y-2">
                <Label>Trial ends</Label>
                <Input
                  type="date"
                  value={form.trialEndsAt}
                  onChange={(event) => setForm((current) => ({ ...current, trialEndsAt: event.target.value }))}
                  disabled={!data?.permissions.canEditProviderRefs}
                />
              </div>
            </div>

            {data?.permissions.canEditProviderRefs ? (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Input
                    value={form.paymentProvider}
                    onChange={(event) => setForm((current) => ({ ...current, paymentProvider: event.target.value }))}
                    placeholder="paystack"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Customer ref</Label>
                  <Input
                    value={form.paymentCustomerRef}
                    onChange={(event) => setForm((current) => ({ ...current, paymentCustomerRef: event.target.value }))}
                    placeholder="cus_..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subscription ref</Label>
                  <Input
                    value={form.paymentSubscriptionRef}
                    onChange={(event) => setForm((current) => ({ ...current, paymentSubscriptionRef: event.target.value }))}
                    placeholder="sub_..."
                  />
                </div>
              </div>
            ) : null}

            <Button className="w-fit" onClick={handleSave} disabled={saving || !data?.permissions.canManageBilling}>
              {saving ? "Saving..." : data?.permissions.canManageBilling ? "Save billing" : "Owner access required"}
            </Button>
            {!data?.permissions.canManageBilling ? (
              <p className="text-xs text-amber-300">
                Workspace admins can inspect billing posture, but only organization owners can change billing contacts.
              </p>
            ) : null}
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Users className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Seat visibility</p>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <div>Seats used: {data?.summary.seatsUsed || 0}</div>
                <div>Seats remaining: {data?.summary.seatsRemaining || 0}</div>
                <div>Privileged users: {data?.summary.privilegedUserCount || 0}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Provider readiness</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={data?.providerReadiness.paystack ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}>
                  Paystack {data?.providerReadiness.paystack ? "ready" : "missing"}
                </Badge>
                <Badge className={data?.providerReadiness.flutterwave ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}>
                  Flutterwave {data?.providerReadiness.flutterwave ? "ready" : "missing"}
                </Badge>
                <Badge className={data?.providerReadiness.stripe ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}>
                  Stripe {data?.providerReadiness.stripe ? "ready" : "missing"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                This is the billing foundation layer: owner-level visibility now, live provider charging integration next.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Boundary</p>
              </div>
              <p className="text-sm text-slate-300">
                Org owners manage billing contacts for their company. Platform-level provider setup, references, and
                future charging logic stay under super-admin control.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
