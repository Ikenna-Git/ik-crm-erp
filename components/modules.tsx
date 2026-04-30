"use client"

import { DollarSign, FolderKanban, Package, ShieldCheck, Users, Users2 } from "lucide-react"

const modules = [
  {
    icon: Users2,
    title: "Sales and CRM",
    description: "For teams that need to see contacts, deals, follow-ups, and custom record fields without getting lost.",
    features: ["Track leads and contacts", "Move deals through the pipeline", "Create follow-up tasks", "Keep records flexible with custom fields"],
  },
  {
    icon: DollarSign,
    title: "Finance and accounting",
    description: "For finance teams that need invoices, expenses, summaries, and queue visibility in one place.",
    features: ["Monitor overdue invoices", "Approve or review expenses", "Export reports", "See live accounting signals"],
  },
  {
    icon: Users,
    title: "People and HR",
    description: "For admin and HR teams that need employee records, attendance, payroll, and status updates that stay organized.",
    features: ["Store employee records", "Track attendance and leave", "Manage payroll views", "Review data quality and reminders"],
  },
  {
    icon: FolderKanban,
    title: "Projects and delivery",
    description: "For delivery teams that need tasks, project boards, status, and timelines without opening six different tools.",
    features: ["Manage project boards", "Track open work", "See project timelines", "Follow progress across teams"],
  },
  {
    icon: Package,
    title: "Inventory and operations",
    description: "For operations teams that need stock, orders, workflows, and follow-through on the work that keeps the company running.",
    features: ["Track products and stock", "Manage inventory orders", "Run workflows and playbooks", "Review operational queues"],
  },
  {
    icon: ShieldCheck,
    title: "Admin and control",
    description: "For founders and company admins who need access control, workspace setup, issue visibility, and safer governance.",
    features: ["Invite users and admins", "Keep founder lock in place", "View issues and health checks", "Manage workspace settings"],
  },
]

export function Modules() {
  return (
    <section id="modules" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">What each team actually gets</p>
          <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Start from the team, not the acronym.</h2>
          <p className="text-base leading-7 text-muted-foreground">
            Civis should feel understandable to a sales lead, an HR manager, an operations officer, and a founder on the
            same day. These modules are being framed around real work, not only ERP labels.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <div
                key={module.title}
                className="rounded-[30px] border border-border/80 bg-card p-7 shadow-sm transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/10 text-accent">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{module.description}</p>
                <ul className="mt-6 space-y-3">
                  {module.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
