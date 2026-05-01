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
  { name: "Overview", href: "/dashboard", icon: BarChart3, module: "overview" as AccessModule },
  { name: "Civis AI", href: "/dashboard/ai", icon: Sparkles, module: "ai" as AccessModule },
  { name: "CRM", href: "/dashboard/crm", icon: Users, module: "crm" as AccessModule },
  { name: "Marketing", href: "/dashboard/marketing", icon: Mail, module: "marketing" as AccessModule },
  { name: "Client Portal", href: "/dashboard/portal", icon: LayoutGrid, module: "portal" as AccessModule },
  { name: "Accounting", href: "/dashboard/accounting", icon: DollarSign, module: "accounting" as AccessModule },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package, module: "inventory" as AccessModule },
  { name: "Projects", href: "/dashboard/projects", icon: CheckSquare, module: "projects" as AccessModule },
  { name: "HR", href: "/dashboard/hr", icon: Users, module: "hr" as AccessModule },
  { name: "Gallery", href: "/dashboard/gallery", icon: ImageIcon, module: "gallery" as AccessModule },
  { name: "Docs", href: "/dashboard/docs", icon: BookOpen, module: "docs" as AccessModule },
  { name: "Demo", href: "/dashboard/demo", icon: Play, module: "demo" as AccessModule },
  { name: "Playbooks", href: "/dashboard/playbooks", icon: ClipboardList, module: "playbooks" as AccessModule },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp, module: "analytics" as AccessModule },
  { name: "Operations", href: "/dashboard/operations", icon: Workflow, module: "operations" as AccessModule },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const navigation = [
    ...baseNavigation.filter((item) => hasModuleAccess(session?.user || {}, item.module, "view")),
    ...(isAdmin(session?.user?.role) ? [{ name: "Admin", href: "/admin", icon: ShieldCheck }] : []),
  ]

  const handleLogout = () => {
    localStorage.removeItem("user")
    signOut({ callbackUrl: "/" })
  }

  return (
    <aside className="w-64 border-r border-border bg-card h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg">Civis</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {navigation.map((item) => {
          const Icon = item.icon
          const isOverview = item.href === "/dashboard"
          const isActive = isOverview
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
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
