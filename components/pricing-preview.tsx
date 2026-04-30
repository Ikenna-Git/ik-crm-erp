"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    price: "₦50,000",
    period: "/ month",
    description: "For small teams getting their first shared workspace in order.",
    features: ["Up to 5 users", "CRM and workspace basics", "Simple invoicing", "Standard support"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₦180,000",
    period: "/ 4 months",
    description: "For growing teams that want one place for sales, people, money, and operations.",
    features: ["Up to 25 users", "All core modules", "Admin control plane", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: " / year",
    description: "For multi-team rollouts, extra controls, and deeper implementation needs.",
    features: ["Unlimited users", "Custom rollout support", "Advanced integrations", "Dedicated account support"],
    highlighted: false,
  },
]

export function PricingPreview() {
  return (
    <section id="pricing" className="py-18 bg-background lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 space-y-3 text-center">
          <h2 className="text-3xl font-semibold sm:text-4xl">Pricing should feel understandable too.</h2>
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground">
            These plans are framed around team size and rollout depth so buyers can understand where they fit quickly.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? "border-primary/40 bg-primary/[0.03] shadow-lg" : "border-border/80 bg-card"}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">{plan.description}</CardDescription>
                  </div>
                  {plan.highlighted ? (
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Best fit</span>
                  ) : null}
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold">{plan.price}</span>
                  <span className="pb-1 text-sm text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
                  <Link href="/pricing">View full pricing</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
