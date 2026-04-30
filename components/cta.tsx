"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

const checklist = [
  "Create your first workspace and invite the right admin",
  "Start with CRM, finance, HR, ops, or client portal based on what your team needs first",
  "Keep founder-level control while stakeholder admins manage their own companies",
]

export function CTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[34px] border border-border/80 bg-[linear-gradient(135deg,rgba(76,139,255,0.96),rgba(61,214,140,0.9))] p-10 text-primary-foreground shadow-2xl lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground/80">Next step</p>
              <h2 className="text-3xl font-semibold sm:text-4xl lg:text-5xl">Make Civis feel easier before you make it bigger.</h2>
              <p className="text-base leading-7 text-primary-foreground/90">
                Start with a cleaner rollout, a better admin control story, and a product that stakeholders can understand
                from the first demo.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/signup">
                    Start setup
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/features">View product scope</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/20 bg-black/15 p-6 backdrop-blur">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                <p className="font-medium">What a good Civis rollout should feel like</p>
              </div>
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-6 text-primary-foreground/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Control model</p>
                  <p className="mt-2 text-lg font-semibold">Founder + workspace admin</p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Team shape</p>
                  </div>
                  <p className="mt-2 text-lg font-semibold">Ops, finance, HR, sales, delivery</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
