"use client"

import { Bot, LayoutDashboard, Layers, Shield, Sparkles, Workflow } from "lucide-react"

const features = [
  {
    icon: LayoutDashboard,
    title: "See what matters first",
    description: "Surface overdue invoices, stalled deals, pending expenses, and risky admin gaps without hopping between tabs.",
  },
  {
    icon: Shield,
    title: "Give access without losing control",
    description: "Founder access stays above the system while workspace admins manage only their own company team.",
  },
  {
    icon: Layers,
    title: "Keep records flexible",
    description: "Use custom fields, editable workspace settings, and cleaner records instead of forcing every business into one rigid form.",
  },
  {
    icon: Workflow,
    title: "Automate repeated work",
    description: "Use workflows, follow-up triggers, reports, and webhooks to reduce manual admin and repetitive operations.",
  },
  {
    icon: Bot,
    title: "Guide normal users clearly",
    description: "Civis AI can explain pages, answer simple business questions, and help people move through the product faster.",
  },
  {
    icon: Sparkles,
    title: "Share updates with clients cleanly",
    description: "Run portal updates, document sharing, and approvals from a client-facing layer instead of messy email chains.",
  },
]

export function Features() {
  return (
    <section id="features" className="bg-muted/35 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Why Civis feels simpler</p>
            <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Less software sprawl. More operational clarity.</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            The goal is not to impress users with jargon. The goal is to help them understand what to do next, who owns it,
            and where the business is exposed.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group rounded-[28px] border border-border/80 bg-card/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
