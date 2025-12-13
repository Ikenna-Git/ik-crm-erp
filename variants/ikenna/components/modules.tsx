"use client"

import { Users2, DollarSign, Package, CheckSquare, Users, TrendingUp } from "lucide-react"

const modules = [
  {
    icon: Users2,
    title: "CRM",
    description: "Manage contacts, leads, and deals with intelligent sales pipeline tracking",
    features: ["Contact Management", "Sales Pipeline", "Activity Tracking", "Lead Scoring"],
  },
  {
    icon: DollarSign,
    title: "Accounting",
    description: "Complete financial management with invoicing, expenses, and tax reporting",
    features: ["Invoicing", "Expense Tracking", "Tax Reports", "Financial Analysis"],
  },
  {
    icon: Package,
    title: "Inventory",
    description: "Real-time inventory tracking with automated reordering and SKU management",
    features: ["Stock Management", "Reorder Points", "Supplier Management", "Barcode Scanning"],
  },
  {
    icon: CheckSquare,
    title: "Projects",
    description: "Collaborate on projects with task management, timelines, and resource planning",
    features: ["Task Management", "Gantt Charts", "Time Tracking", "Team Collaboration"],
  },
  {
    icon: Users,
    title: "HR",
    description: "Manage employees, payroll, attendance, and performance reviews",
    features: ["Employee Database", "Payroll", "Attendance", "Performance Reviews"],
  },
  {
    icon: TrendingUp,
    title: "Business Intelligence",
    description: "Deep insights with custom dashboards, KPIs, and predictive analytics",
    features: ["Custom Dashboards", "KPI Tracking", "Forecasting", "Data Visualization"],
  },
]

export function Modules() {
  return (
    <section id="modules" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Complete Business Modules</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every function you need, integrated into one unified platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, idx) => {
            const Icon = module.icon
            return (
              <div
                key={idx}
                className="p-8 rounded-xl border border-border bg-card hover:border-accent/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{module.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{module.description}</p>
                <ul className="space-y-2">
                  {module.features.map((feature, fidx) => (
                    <li key={fidx} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent font-bold">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
