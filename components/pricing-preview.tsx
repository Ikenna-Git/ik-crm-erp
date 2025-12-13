"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "₦50,000",
    period: "/ month",
    description: "Perfect for small teams",
    features: ["Up to 5 users", "CRM module", "Basic invoicing", "Email support"],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₦180,000",
    period: "/ 4 months",
    description: "For growing teams that need all modules",
    features: ["Up to 25 users", "All modules", "CSV export", "Priority support"],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: " per year",
    description: "Tailored for larger organizations",
    features: ["Unlimited users", "Custom integrations", "SLA", "Dedicated support"],
    highlighted: false,
  },
]

export function PricingPreview() {
  return (
    <section id="pricing" className="py-16 lg:py-20 bg-muted/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold">Pricing at a glance</h2>
          <p className="text-muted-foreground text-lg">See plans now, view details anytime on the pricing page.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`${plan.highlighted ? "border-primary shadow-lg scale-[1.02]" : ""}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {plan.highlighted && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                      Popular
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-green-600" />
                      {feature}
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
