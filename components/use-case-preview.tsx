"use client"

import Link from "next/link"
import { ArrowRight, Blocks, BriefcaseBusiness, LifeBuoy, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const cards = [
  {
    icon: BriefcaseBusiness,
    title: "Use cases",
    description: "See how founders, operations, finance, HR, and client teams can adopt Civis without all starting at once.",
    href: "/use-cases",
    cta: "Explore use cases",
  },
  {
    icon: Blocks,
    title: "Integrations",
    description: "See what is live, what is config-ready, and what should plug into the platform as the rollout deepens.",
    href: "/integrations",
    cta: "View integrations",
  },
  {
    icon: ShieldCheck,
    title: "Trust and rollout",
    description: "Review founder control, admin boundaries, onboarding flow, docs, and support signals before a serious demo.",
    href: "/trust",
    cta: "Open trust guide",
  },
]

export function UseCasePreview() {
  return (
    <section className="bg-muted/35 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Next layer of product clarity</p>
          <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Help people understand where Civis fits before they ever sign in.</h2>
          <p className="text-base leading-7 text-muted-foreground">
            Better products do not only have features. They explain who they are for, how they connect to existing tools,
            and why buyers should trust the rollout.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="rounded-[30px] border border-border/80 bg-card p-7 shadow-sm">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-accent/10 text-accent">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">{card.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{card.description}</p>
                <Button className="mt-6" variant="outline" asChild>
                  <Link href={card.href}>
                    {card.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-10 rounded-[30px] border border-border/80 bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <LifeBuoy className="h-4 w-4 text-primary" />
                Support and rollout layer
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Docs, onboarding, help flow, founder guidance, and rollout trust are now part of the product story, not an afterthought.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/docs">Open docs</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
