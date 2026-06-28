"use client"

import Link from "next/link"
import { Building2, ExternalLink, FolderKanban, Rocket, Settings, ShieldCheck } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useWorkspaceContext } from "@/components/workspace/use-workspace-context"
import { getWorkspaceInitials } from "@/lib/workspace-context"

export function WorkspaceContextCard() {
  const { data, loading, error } = useWorkspaceContext()
  const initials = getWorkspaceInitials(data?.org.name)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full rounded-3xl border border-white/10 bg-white/[0.05] px-3 py-3 text-left shadow-[0_16px_40px_-28px_rgba(15,23,42,0.8)] transition hover:border-primary/30 hover:bg-white/[0.08]"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
          <div className="mt-3 flex items-start gap-3">
            {data?.org.logoUrl ? (
              <img src={data.org.logoUrl} alt={`${data.org.name} logo`} className="h-11 w-11 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data?.org.name || (loading ? "Loading workspace..." : "Founder workspace")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {data?.viewer.roleLabel || "Owner"} · {data?.launch.modeLabel || "Setup mode"}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {error || data?.launch.summary || "Launch readiness: Action required"}
              </p>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-3xl border-white/12 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Workspace operating context</DialogTitle>
          <DialogDescription>
            Company identity, role scope, operating mode, and launch readiness should stay visible without leaving the shell.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card/70 p-4">
            <div className="flex items-start gap-3">
              {data?.org.logoUrl ? (
                <img src={data.org.logoUrl} alt={`${data.org.name} logo`} className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-lg font-semibold text-primary">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{data?.org.name || "Founder workspace"}</p>
                <p className="text-sm text-muted-foreground">
                  {data?.viewer.roleLabel || "Owner"} · {data?.launch.modeLabel || "Setup mode"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{data?.launch.summary || "Launch readiness: Action required"}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Industry</p>
              <p className="mt-2 text-sm font-medium">{data?.org.industry || "Not set yet"}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Operating template</p>
              <p className="mt-2 text-sm font-medium">{data?.org.operatingTemplateLabel || "Not set yet"}</p>
            </div>
          </div>

          {data?.launch.blockers?.length ? (
            <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Primary blockers</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {data.launch.blockers.map((blocker) => (
                  <li key={blocker.id}>{blocker.label}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild className="justify-between">
              <Link href="/dashboard/setup">
                Open Setup
                <Rocket className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-transparent">
              <Link href="/dashboard/settings">
                Workspace settings
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-transparent">
              <Link href="/dashboard/projects">
                Open Projects
                <FolderKanban className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between bg-transparent">
              <Link href="/dashboard/ai">
                Ask Civis Guide
                <Building2 className="h-4 w-4" />
              </Link>
            </Button>
            {data?.viewer.canViewFounderControls ? (
              <Button asChild variant="outline" className="justify-between bg-transparent sm:col-span-2">
                <Link href="/admin/launch-readiness">
                  Admin Centre / Launch Readiness
                  <ShieldCheck className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            {error ? error : "Company identity is org-scoped and refresh-safe. No local workspace branding cache is used here."}
            {!error ? <ExternalLink className="ml-1 inline h-3 w-3" /> : null}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
