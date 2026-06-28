"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Building2, CreditCard, Palette, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkspaceIdentityManager } from "@/components/workspace/workspace-identity-manager"
import { getApiErrorMessage, requestJson } from "@/lib/api-client"

type WorkspaceResponse = {
  org: {
    id: string
    name: string
    theme?: string | null
    notifyEmail?: string | null
    createdAt: string
  }
  summary: {
    userCount: number
    adminCount: number
    crmFieldCount: number
  }
  permissions: {
    canManageWorkspace: boolean
    canManageBilling: boolean
    isPlatformSuperAdmin: boolean
  }
}

export default function AdminWorkspacePage() {
  const [data, setData] = useState<WorkspaceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError("")
        const payload = await requestJson<WorkspaceResponse>("/api/admin/workspace")
        setData(payload)
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load workspace"))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-300">Loading workspace controls...</p>
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/5 text-slate-100">
        <CardHeader>
          <CardTitle>Workspace profile</CardTitle>
          <CardDescription className="text-slate-400">
            Control the visible identity and notification routing for this workspace. Company identity is stored against
            the real organisation record and reused across setup, launch readiness, and shell context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <WorkspaceIdentityManager
            title="Workspace identity"
            description="This is the operating-centre profile for the current organisation. Save it here and confirm the same identity appears in the sidebar and setup flow."
            compact
          />

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Workspace footprint</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <div>Users: {data?.summary.userCount || 0}</div>
                <div>Admins: {data?.summary.adminCount || 0}</div>
                <div>CRM field presets: {data?.summary.crmFieldCount || 0}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <Palette className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Governance guardrail</p>
              </div>
              <p className="text-sm text-slate-300">
                Company identity is workspace-scoped. Platform org creation and founder controls stay in the super-admin
                system page, but company name, logo, industry, and operating template should be maintained inside the
                actual workspace.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="font-medium">Next step</p>
              </div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-between border-white/10 bg-transparent text-slate-100" asChild>
                  <Link href="/admin/users">
                    Open team, roles, and job access
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-between border-white/10 bg-transparent text-slate-100" asChild>
                  <Link href="/admin/billing">
                    Review billing and seats
                    <CreditCard className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  )
}
