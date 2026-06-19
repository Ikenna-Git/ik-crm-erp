"use client"

import Link from "next/link"
import { ArrowRight, Bot, BriefcaseBusiness, ShieldCheck, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"

const problems = [
  "Leads, invoices, approvals, and people data are scattered across disconnected tools.",
  "Founders need control without giving every workspace admin platform-wide power.",
  "Teams need clear next steps, not another dashboard that looks finished but hides setup gaps.",
]

const workflows = [
  {
    title: "Sell with context",
    description: "Move from contacts to deals, invoices, follow-ups, and client updates without leaving one governed workspace.",
  },
  {
    title: "Operate with approvals",
    description: "Route finance and ops work through real approval queues instead of informal DMs and missing accountability.",
  },
  {
    title: "Protect sensitive modules",
    description: "Keep HR and Accounting privacy locked until an authorized manager intentionally unlocks them for the session.",
  },
]

export function LandingStory() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto flex max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Why teams switch</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Civis is the AI-native operating centre for teams that need CRM, finance, operations, people, and approvals in one place.
            </h2>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">
              Watch work move through your operating centre. Civis routes leads, approvals, privacy-aware records, and next actions through one connected system instead of scattered tools.
            </p>
          </div>
          <div className="grid gap-4">
            {problems.map((problem) => (
              <div
                key={problem}
                data-cursor="card"
                className="rounded-[28px] border border-border/80 bg-card/90 p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="text-sm leading-7 text-muted-foreground">{problem}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div data-cursor="card" className="rounded-[32px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-7 shadow-sm">
            <div className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <Bot className="h-5 w-5 text-primary" />
              AI-native, not AI-painted
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">Civis Guide helps users move, not just chat.</h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Deterministic commands still work without provider keys. Provider-backed drafting adds depth when configured.
              The assistant knows routes, product rules, locked modules, and what still requires setup.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">Try asking</p>
                <p className="mt-2 text-sm text-muted-foreground">“Take me to sales pipeline” or “What should I do next?”</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-sm font-medium text-foreground">Civis stays honest</p>
                <p className="mt-2 text-sm text-muted-foreground">If a provider, workflow, or module is missing setup, Civis says so clearly.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.title}
                data-cursor={workflow.title.includes("Protect") ? "lock" : "card"}
                className="rounded-[28px] border border-border/80 bg-card p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center gap-3">
                  {workflow.title.includes("Sell") ? (
                    <BriefcaseBusiness className="h-5 w-5 text-primary" />
                  ) : workflow.title.includes("Protect") ? (
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  ) : (
                    <Workflow className="h-5 w-5 text-primary" />
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{workflow.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{workflow.description}</p>
              </div>
            ))}
            <Button asChild className="w-fit">
              <Link href="/signup">
                Start your governed workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
