"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeftRight, Building2, Cpu, CreditCard, LockKeyhole, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { isAdmin, isOrgOwner, isSuperAdmin } from "@/lib/authz"

const navItems = [
  { href: "/admin", label: "Ops Center", icon: ShieldCheck, superOnly: false },
  { href: "/admin/users", label: "Users", icon: Users, superOnly: false },
  { href: "/admin/workspace", label: "Workspace", icon: Building2, superOnly: false },
  { href: "/admin/billing", label: "Billing", icon: CreditCard, superOnly: false },
  { href: "/admin/security", label: "Risk & Access", icon: LockKeyhole, superOnly: false },
  { href: "/admin/system", label: "Founder Desk", icon: Cpu, superOnly: true },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const role = session?.user?.role

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && !isAdmin(role)) {
      router.push("/dashboard")
    }
  }, [role, router, status])

  const items = useMemo(
    () => navItems.filter((item) => (item.superOnly ? isSuperAdmin(role) : true)),
    [role],
  )

  if (status === "loading") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-10 w-10 rounded-2xl bg-emerald-500/20" />
          <p className="text-sm text-slate-300">Loading admin control plane...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin(role)) {
    return null
  }

  const label = isSuperAdmin(role) ? "Platform Super Admin" : isOrgOwner(role) ? "Organization Owner" : "Workspace Admin"

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-white/10 bg-slate-950/70 backdrop-blur xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Civis Control</p>
                <h1 className="text-lg font-semibold">Admin Plane</h1>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {items.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                    active
                      ? "bg-emerald-500/15 text-white shadow-[inset_0_0_0_1px_rgba(52,211,153,0.25)]"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/10 p-4">
            <Card className="border-white/10 bg-white/5 text-slate-100">
              <CardHeader className="space-y-2 pb-3">
                <Badge className="w-fit bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15">{label}</Badge>
                <CardTitle className="text-sm">{session?.user?.name || session?.user?.email || "Admin"}</CardTitle>
                <CardDescription className="text-slate-400">{session?.user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start border-white/10 bg-transparent text-slate-100" asChild>
                  <Link href="/dashboard">
                    <ArrowLeftRight className="mr-2 h-4 w-4" />
                    Return to workspace
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="border-b border-white/10 bg-slate-950/45 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-300/80">Administration</p>
                <h2 className="text-xl font-semibold">Operations, access, and workspace control</h2>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  {label}
                </Badge>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
