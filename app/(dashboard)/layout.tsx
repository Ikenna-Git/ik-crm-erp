import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { DashboardLayoutShell } from "@/components/dashboard-layout-shell"
import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }

  return <DashboardLayoutShell>{children}</DashboardLayoutShell>
}
