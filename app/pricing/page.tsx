"use client"

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      description: "Perfect for small businesses",
      monthlyPrice: 50000,
      billingPeriod: "month",
      features: [
        "Up to 5 users",
        "CRM Module",
        "Basic Invoicing",
        "1 GB Storage",
        "Email Support",
        "14-day free trial",
      ],
      highlighted: false,
    },
    {
      name: "Professional",
      description: "For growing teams",
      monthlyPrice: 180000,
      billingPeriod: "4 months",
      yearlyPrice: 540000,
      discount: "25% savings",
      features: [
        "Up to 25 users",
        "All Modules (CRM, Accounting, Inventory, Projects, HR)",
        "Advanced Invoicing & Expenses",
        "10 GB Storage",
        "CSV Import/Export",
        "Priority Email Support",
        "Admin & User Roles",
        "Analytics Dashboard",
        "14-day free trial",
      ],
      highlighted: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations",
      monthlyPrice: 500000,
      billingPeriod: "year",
      discount: "Custom pricing available",
      features: [
        "Unlimited users",
        "All Features Included",
        "Unlimited Storage",
        "Custom Integrations",
        "Dedicated Support Team",
        "Advanced Security",
        "White-label Options",
        "SLA Guarantee",
        "On-premise Deployment Option",
      ],
      highlighted: false,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">I</span>
            </div>
            <span className="font-bold text-primary">Civis</span>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
        {/* Heading */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground">
            Choose the perfect plan for your business needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`flex flex-col ${plan.highlighted ? "border-primary border-2 shadow-lg scale-105" : ""}`}
            >
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                  {plan.highlighted && (
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      Popular
                    </div>
                  )}
                </div>
              </CardHeader>

            <CardContent className="flex-1 space-y-6">
              {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">₦{plan.monthlyPrice.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.billingPeriod}</span>
                  </div>
                  {plan.discount && <p className="text-sm font-medium text-green-600">{plan.discount}</p>}
                </div>

              {/* CTA Button */}
                <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                  Get Started
                </Button>

                {/* Features */}
                <div className="space-y-3 pt-6 border-t border-border">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="border-t border-border pt-12 space-y-8">
          <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <h3 className="font-semibold">Can I change plans later?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept bank transfers, cards, and mobile money (MTN, Airtel) for Nigerian customers.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Is there a contract?</h3>
              <p className="text-sm text-muted-foreground">
                No contracts required. Cancel anytime with no penalties. Your data is always yours.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">What about custom plans?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our sales team for custom enterprise solutions tailored to your needs.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-lg p-12 text-center space-y-4">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="text-lg opacity-90">
            Join thousands of Nigerian businesses using Civis to manage their operations.
          </p>
          <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            Start Your Free Trial
          </Button>
        </div>
      </div>
    </div>
  )
}
