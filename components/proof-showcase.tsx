"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const proofStats = [
  { value: "6", label: "core business work areas" },
  { value: "1", label: "founder-led control plane" },
  { value: "3", label: "AI provider paths supported" },
  { value: "24/7", label: "visibility into queues and issues" },
]

const trustSignals = [
  "Founder-locked super-admin model",
  "Workspace-scoped admin and invite flow",
  "OpenAPI docs and internal admin controls",
  "Custom CRM fields, workflows, reports, and webhooks",
]

const screenshots = [
  {
    title: "Operational dashboard",
    src: "/dashboard-analytics-interface.png",
  },
  {
    title: "Client and portal visibility",
    src: "/crm-contacts-management.jpg",
  },
  {
    title: "Security and governance direction",
    src: "/security-compliance-data.jpg",
  },
]

export function ProofShowcase() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Proof and trust</p>
            <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Show stakeholders what is real, not just what is promised.</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Civis now has the structure to talk about governance, admin control, workflows, portal sharing, API coverage,
            and product breadth in a more credible way. This section is the bridge between raw features and buyer trust.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="space-y-6 rounded-[32px] border border-border/80 bg-card p-7 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              {proofStats.map((item) => (
                <div key={item.label} className="rounded-3xl border border-border/70 bg-background/80 p-5">
                  <p className="text-3xl font-semibold text-foreground">{item.value}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/80 p-5">
              <p className="text-sm font-medium text-foreground">Trust signals you can point to now</p>
              <div className="mt-4 space-y-3">
                {trustSignals.map((signal) => (
                  <div key={signal} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild>
                <Link href="/trust">
                  View trust and rollout guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard/docs/api">Open API docs</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {screenshots.map((shot) => (
              <div key={shot.title} className="overflow-hidden rounded-[28px] border border-border/80 bg-card shadow-sm">
                <div className="relative aspect-[4/4.2] overflow-hidden">
                  <Image src={shot.src} alt={shot.title} fill className="object-cover" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    {shot.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
