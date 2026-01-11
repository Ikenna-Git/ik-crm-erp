"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navigation = [
  { name: "Overview", href: "/dashboard", icon: BarChart3 },
  { name: "CRM", href: "/dashboard/crm", icon: Users },
  { name: "Accounting", href: "/dashboard/accounting", icon: DollarSign },
  { name: "Inventory", href: "/dashboard/inventory", icon: Package },
  { name: "Projects", href: "/dashboard/projects", icon: CheckSquare },
  { name: "HR", href: "/dashboard/hr", icon: Users },
  { name: "Gallery", href: "/dashboard/gallery", icon: ImageIcon },
  { name: "Docs", href: "/dashboard/docs", icon: BookOpen },
  { name: "Demo", href: "/dashboard/demo", icon: Play },
  { name: "Analytics", href: "/dashboard/analytics", icon: TrendingUp },
  { name: "Operations", href: "/dashboard/operations", icon: Workflow },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const handleLogout = () => {
    localStorage.removeItem("user")
    window.location.href = "/"
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
