"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"

export default function FeaturesPage() {
  const features = [
    {
      title: "CRM Management",
      description: "Complete customer relationship management",
      items: [
        "Contact Management with full history",
        "Sales Pipeline with Kanban boards",
        "Activity Tracking and logging",
        "Lead Scoring and qualification",
        "Email integration and follow-ups",
      ],
    },
    {
      title: "Accounting & Finance",
      description: "Comprehensive financial management",
      items: [
        "Invoice creation and tracking",
        "Automated expense management",
        "Financial reports and analytics",
        "Tax calculation and compliance",
        "Multi-currency support",
      ],
    },
    {
      title: "Inventory Management",
      description: "Efficient stock and supply chain control",
      items: [
        "Real-time stock tracking",
        "Automated reorder points",
        "Supplier management",
        "Barcode scanning support",
        "Warehouse organization",
      ],
    },
    {
      title: "Project Management",
      description: "Plan and execute projects seamlessly",
      items: [
        "Project boards and dashboards",
        "Kanban task management",
        ...(flags.raptorMini ? ["Gantt chart timeline views"] : []),
        "Team collaboration tools",
        "Time and budget tracking",
      ],
    },
    {
      title: "HR & Payroll",
      description: "Complete employee management system",
      items: [
        "Employee database and records",
        "Automated payroll processing",
        "Attendance tracking",
        "Leave management",
        "Performance reviews",
      ],
    },
    {
      title: "Advanced Analytics",
      description: "Data-driven insights and reporting",
      items: [
        "Custom dashboards",
        "KPI tracking and monitoring",
        "Sales forecasting",
        "Revenue analytics",
        "Data visualization tools",
      ],
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
          <h1 className="text-4xl font-bold">Powerful Features</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to manage your entire business in one platform
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-lg p-12 text-center space-y-4">
          <h2 className="text-3xl font-bold">Ready to explore Civis?</h2>
          <p className="text-lg opacity-90">
            Start your 14-day free trial and experience the power of integrated business management.
          </p>
          <div className="flex gap-4 justify-center">
            <Button className="bg-primary-foreground text-primary hover:bg-primary-foreground/90" asChild>
              <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
              asChild
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
