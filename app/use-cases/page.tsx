"use client"

import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, HandCoins, ShieldCheck, UsersRound, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const useCases = [
  {
    icon: ShieldCheck,
    title: "For founders and company owners",
    summary: "Stay above the whole platform while each company admin handles only their own workspace.",
    points: ["Founder-only super admin", "Workspace creation and admin invites", "Cross-workspace oversight", "Control of trust, readiness, and rollout"],
  },
  {
    icon: Workflow,
    title: "For operations teams",
    summary: "Keep approvals, workflows, tasks, and alerts organized in one command layer.",
    points: ["Track operational queues", "Run playbooks and workflows", "See what is blocked first", "Reduce manual follow-through"],
  },
  {
    icon: BriefcaseBusiness,
    title: "For sales and client teams",
    summary: "Manage contacts, deals, follow-ups, and client updates without stitching together too many tools.",
    points: ["Pipeline and follow-up visibility", "Client portal sharing", "Custom CRM fields", "Cleaner record updates"],
  },
  {
    icon: HandCoins,
    title: "For finance teams",
    summary: "See overdue invoices, pending expenses, and summary signals in a way that feels operational, not buried.",
    points: ["Invoice queue", "Expense approvals", "Reports and exports", "Finance visibility inside admin"],
  },
  {
    icon: UsersRound,
    title: "For HR and people ops",
    summary: "Keep employee records, attendance, leave, and payroll status easier to understand across one workspace.",
    points: ["Employee profile tracking", "Attendance and leave visibility", "Payroll records", "Return reminders and admin updates"],
  },
]

export default function UseCasesPage() {
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
              <Link href="/integrations">Integrations</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start setup</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Use cases</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">Adopt Civis by role, not all at once.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A strong rollout does not dump every module on every team. It starts with the part of the business that needs
              the most clarity, then expands with governance still intact.
            </p>
          </div>

          <div className="rounded-[30px] border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground">Rollout logic that usually works best</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <p>1. Founder or stakeholder admin sets up the workspace.</p>
              <p>2. The first company admin is invited and activated.</p>
              <p>3. Sales, finance, ops, or HR starts from the most urgent workflow.</p>
              <p>4. Portal, automation, integrations, and broader admin maturity expand later.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {useCases.map((useCase) => {
            const Icon = useCase.icon
            return (
              <Card key={useCase.title} className="rounded-[30px] border-border/80 bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-7">{useCase.summary}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {useCase.points.map((point) => (
                    <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold">Want the next layer of product fit?</h2>
              <p className="text-base leading-7 text-muted-foreground">
                The next questions are usually about integrations, rollout trust, and whether the admin model is strong enough
                for a real company setup.
              </p>
            </div>
            <Button asChild>
              <Link href="/trust">
                Open trust guide
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
