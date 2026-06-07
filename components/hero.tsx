"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const quickPoints = [
  "CRM, finance, HR, projects, documents, and approvals in one governed workspace",
  "Founder keeps platform control while each company admin stays inside their own org boundary",
  "Built for growing teams that need clarity, approvals, privacy locks, and trust before complexity",
]

const proofCards = [
  { label: "Founder control", value: "Platform locked" },
  { label: "Workspace admins", value: "Scoped by company" },
  { label: "Launch posture", value: "Evidence-aware" },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-24 lg:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(76,139,255,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(61,214,140,0.16),_transparent_24%)]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Built for founders and operators</Badge>
            <Badge variant="outline" className="border-border/80 bg-background/80">
              Clearer than a patchwork stack
            </Badge>
          </div>

          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              The AI-native CRM and ERP command centre for teams that need one governed workspace.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Civis connects CRM, approvals, finance, people, inventory, operations, and admin control into one calm operating layer. It is built to guide teams clearly, not overwhelm them with dashboard noise.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {proofCards.map((card) => (
              <div key={card.label} className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup" className="flex items-center gap-2">
                Start your workspace
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Review launch-safe pricing
              </Link>
            </Button>
          </div>

          <div className="space-y-3 rounded-3xl border border-border/80 bg-card/70 p-5 shadow-sm">
            {quickPoints.map((point) => (
              <div key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-5 top-6 hidden rounded-3xl border border-border/70 bg-background/85 p-4 shadow-xl backdrop-blur md:block">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Ops summary
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Overdue invoices, stalled deals, pending approvals, and admin actions in one view.</p>
          </div>

          <div className="group rounded-[32px] border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-4 shadow-2xl">
            <div className="overflow-hidden rounded-[24px] border border-border/70 bg-background">
              <Image
                src="/dashboard-analytics-interface.png"
                alt="Civis product dashboard"
                width={1400}
                height={1000}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>

          <div className="absolute -bottom-5 right-0 hidden w-64 rounded-3xl border border-border/70 bg-background/90 p-4 shadow-xl backdrop-blur md:block">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin flow</p>
              <p className="mt-2 text-sm font-medium text-foreground">Invite the company admin, preserve founder-only controls, and keep sensitive modules privacy locked until explicitly unlocked.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
