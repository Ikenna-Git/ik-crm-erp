"use client"

import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, Building2, Check, HandCoins, ShieldCheck, UsersRound, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const featureGroups = [
  {
    icon: BriefcaseBusiness,
    title: "For sales and customer teams",
    description: "Keep contacts, deals, reminders, and client follow-ups visible without building a maze of spreadsheets.",
    items: ["Contacts with history", "Deals and pipeline stages", "Follow-up scheduling", "Flexible custom fields"],
  },
  {
    icon: HandCoins,
    title: "For finance and approvals",
    description: "Keep invoices, expenses, and business reporting in one finance flow that is easy to follow.",
    items: ["Invoice queue", "Expense approvals", "Summary reporting", "Export-ready views"],
  },
  {
    icon: UsersRound,
    title: "For HR and people ops",
    description: "Track employees, attendance, leave, and payroll status in one place instead of scattered admin files.",
    items: ["Employee records", "Attendance status", "Leave tracking", "Payroll views"],
  },
  {
    icon: Workflow,
    title: "For operations and delivery",
    description: "Run tasks, workflows, projects, and operational follow-through without guessing what is blocked.",
    items: ["Projects and tasks", "Operations workflows", "Playbooks and webhooks", "Command center signals"],
  },
  {
    icon: ShieldCheck,
    title: "For founders and admins",
    description: "Keep the platform structured with cleaner access, workspace setup, and issue visibility.",
    items: ["Founder-only super admin", "Workspace-scoped admins", "Invite-based user setup", "Admin ops center"],
  },
  {
    icon: Building2,
    title: "For client communication",
    description: "Share updates and documents through a cleaner portal instead of chaotic email threads.",
    items: ["Client portal links", "Portal updates", "Document sharing", "Approval flow"],
  },
]

const simplificationPoints = [
  "Plain-language section titles instead of heavy ERP language",
  "Fewer dead-end pages and more next-step guidance",
  "Admin pages that show issues, health checks, and priority actions",
  "A product story that normal users can understand on first contact",
]

export default function FeaturesPage() {
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
              <Link href="/admin">View admin ops center</Link>
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
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Simplified product scope</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">Civis should be broad, but still understandable.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              The job now is to make the platform easier to explain, easier to operate, and easier for normal business
              users to trust. These are the capabilities we are shaping into a cleaner experience.
            </p>
          </div>

          <div className="rounded-[30px] border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground">What we are actively fixing</p>
            <div className="mt-4 space-y-3">
              {simplificationPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 text-sm leading-7 text-muted-foreground">
                  <Check className="mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featureGroups.map((group) => {
            const Icon = group.icon
            return (
              <Card key={group.title} className="rounded-[28px] border-border/80 bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{group.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-7">{group.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-8 shadow-sm lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold">What better looks like from here</h2>
              <p className="text-base leading-7 text-muted-foreground">
                A stronger admin ops center, a cleaner landing page, clearer team flows, and a product that feels more
                credible in front of stakeholders the first time they see it.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/80 bg-background/80 p-5">
                <p className="font-medium text-foreground">Admin should show issues, not emptiness</p>
                <p className="mt-2 text-sm text-muted-foreground">Health, access, queue risks, and next actions should be visible without digging.</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/80 p-5">
                <p className="font-medium text-foreground">Landing should explain the product quickly</p>
                <p className="mt-2 text-sm text-muted-foreground">Fewer buzzwords, more trust, clearer product structure, better proof.</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/80 p-5">
                <p className="font-medium text-foreground">Users should understand their section</p>
                <p className="mt-2 text-sm text-muted-foreground">CRM, HR, finance, and ops should feel guided instead of overwhelming.</p>
              </div>
              <div className="rounded-3xl border border-border/80 bg-background/80 p-5">
                <p className="font-medium text-foreground">Stakeholders should trust the control model</p>
                <p className="mt-2 text-sm text-muted-foreground">Founder control, company admin limits, invites, and auditability must feel solid.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-[30px] bg-primary px-8 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-semibold">Ready to see the cleaner direction live?</h2>
          <p className="max-w-2xl text-base text-primary-foreground/90">
            Open the admin plane, review the product structure, and keep iterating from the parts that improve clarity first.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href="/admin">
                Open admin ops center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
