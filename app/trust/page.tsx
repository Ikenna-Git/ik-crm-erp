"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, LifeBuoy, LockKeyhole, MonitorCog, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const trustAreas = [
  {
    icon: ShieldCheck,
    title: "Control model",
    description: "Founder-level super admin stays above the whole platform while company admins remain limited to their own workspace.",
  },
  {
    icon: Users,
    title: "Workspace onboarding",
    description: "Create a workspace, invite the first admin, let them activate access, and let them bring in their own team safely.",
  },
  {
    icon: LockKeyhole,
    title: "Security direction",
    description: "2FA support, protected admin boundaries, audit trail coverage, and NDPA/VAPT planning are part of the product path.",
  },
  {
    icon: BookOpen,
    title: "Docs and support layer",
    description: "API docs, product docs, onboarding guidance, and admin help should sit inside the product story, not outside it.",
  },
  {
    icon: LifeBuoy,
    title: "Rollout trust",
    description: "Stakeholders need to know who owns setup, how support works, and where to go when they need help or guidance.",
  },
  {
    icon: MonitorCog,
    title: "Operational visibility",
    description: "Admin and founder views should surface issues, readiness, and next actions instead of leaving problems buried in logs.",
  },
]

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-primary">Civis</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard/docs">Docs</Link>
            </Button>
            <Button asChild>
              <Link href="/admin">Open admin</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Trust and rollout</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">Civis should feel safe to hand over to a real company.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              This page is where you explain the control model, the onboarding logic, the support path, and the security
              direction that make the platform credible beyond a nice demo.
            </p>
          </div>

          <div className="rounded-[30px] border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground">What serious stakeholders usually ask first</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Who controls the platform and who controls a company workspace?</p>
              <p>How are users invited, activated, and limited?</p>
              <p>Where do we go for docs, help, setup, and issues?</p>
              <p>How safe is the data and how observable is the system?</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trustAreas.map((area) => {
            const Icon = area.icon
            return (
              <Card key={area.title} className="rounded-[30px] border-border/80 bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{area.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-7">{area.description}</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold">Support and credibility should live inside the product story.</h2>
              <p className="text-base leading-7 text-muted-foreground">
                Civis now has docs, admin controls, founder-level governance, and a clearer rollout direction. The next
                step is to keep tightening this into a platform people can trust without overexplaining.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard/docs">
                  Open docs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/system">Founder desk</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
