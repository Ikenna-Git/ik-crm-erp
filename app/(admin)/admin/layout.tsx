import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { AdminShell } from "@/components/admin/admin-shell"
import { authOptions } from "@/lib/auth"
import { canAccessWorkspaceAdmin } from "@/lib/authz"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const user = session?.user

  if (!user?.email) {
    redirect("/login")
  }

  if (!canAccessWorkspaceAdmin(user)) {
    redirect("/dashboard")
  }

  return <AdminShell>{children}</AdminShell>
}
