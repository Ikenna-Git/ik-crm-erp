"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  BarChart3,
  DollarSign,
  Package,
  CheckSquare,
  Users,
  TrendingUp,
  Settings,
  Workflow,
  LogOut,
  ImageIcon,
  BookOpen,
  Play,
  ClipboardList,
  LayoutGrid,
  Sparkles,
  Mail,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { hasModuleAccess, type AccessModule } from "@/lib/access-control"
import { isAdmin } from "@/lib/authz"

const baseNavigation = [
  { section: "Command", name: "Overview", href: "/dashboard", icon: BarChart3, module: "overview" as AccessModule },
  { section: "Command", name: "Civis Guide", href: "/dashboard/ai", icon: Sparkles, module: "ai" as AccessModule },
  { section: "Revenue", name: "CRM", href: "/dashboard/crm", icon: Users, module: "crm" as AccessModule },
  { section: "Revenue", name: "Marketing", href: "/dashboard/marketing", icon: Mail, module: "marketing" as AccessModule },
  { section: "Revenue", name: "Client Portal", href: "/dashboard/portal", icon: LayoutGrid, module: "portal" as AccessModule },
  { section: "Revenue", name: "Accounting", href: "/dashboard/accounting", icon: DollarSign, module: "accounting" as AccessModule, badge: "PIN" },
  { section: "Workspace", name: "Inventory", href: "/dashboard/inventory", icon: Package, module: "inventory" as AccessModule },
  { section: "Workspace", name: "Projects", href: "/dashboard/projects", icon: CheckSquare, module: "projects" as AccessModule },
  { section: "Workspace", name: "HR", href: "/dashboard/hr", icon: Users, module: "hr" as AccessModule, badge: "PIN" },
  { section: "Workspace", name: "Gallery", href: "/dashboard/gallery", icon: ImageIcon, module: "gallery" as AccessModule },
  { section: "Workspace", name: "Docs", href: "/dashboard/docs", icon: BookOpen, module: "docs" as AccessModule },
  { section: "Workspace", name: "Demo", href: "/dashboard/demo", icon: Play, module: "demo" as AccessModule },
  { section: "Ops", name: "Playbooks", href: "/dashboard/playbooks", icon: ClipboardList, module: "playbooks" as AccessModule },
  { section: "Ops", name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, module: "analytics" as AccessModule },
  { section: "Ops", name: "Operations", href: "/dashboard/operations", icon: Workflow, module: "operations" as AccessModule },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const workspaceLabel =
    session?.user?.role === "SUPER_ADMIN"
      ? "Founder workspace"
      : session?.user?.role === "ORG_OWNER"
        ? "Workspace owner"
        : session?.user?.role === "ADMIN"
          ? "Workspace admin"
          : "Workspace member"
  const navigation = [
    ...baseNavigation.filter((item) => hasModuleAccess(session?.user || {}, item.module, "view")),
    ...(isAdmin(session?.user?.role) ? [{ name: "Admin", href: "/admin", icon: ShieldCheck }] : []),
  ]
  const groupedNavigation = navigation.reduce<Record<string, typeof navigation>>((acc, item) => {
    const section = "section" in item && item.section ? item.section : "Admin"
    acc[section] = [...(acc[section] || []), item]
    return acc
  }, {})

  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <aside className="w-64 border-r border-border/70 bg-card/95 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border/70 space-y-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg">Civis</span>
        </Link>
        <div className="rounded-2xl border border-border bg-background/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workspace context</p>
          <p className="mt-1 text-sm font-medium">{workspaceLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-auto p-4">
        {Object.entries(groupedNavigation).map(([section, items]) => (
          <div key={section} className="space-y-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{section}</p>
            {items.map((item) => {
          const Icon = item.icon
          const isOverview = item.href === "/dashboard"
          const isActive = isOverview
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
              {"badge" in item && item.badge ? (
                <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" asChild>
          <Link href="/dashboard/settings">
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive bg-transparent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
