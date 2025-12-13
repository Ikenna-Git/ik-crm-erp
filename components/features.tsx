"use client"

import { Zap, BarChart3, Users, Shield, Workflow, Layers } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern cloud infrastructure with sub-second response times",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Real-time dashboards and comprehensive reporting across all modules",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Built-in tools for seamless team communication and task management",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption, SSO, and compliance with global standards",
  },
  {
    icon: Workflow,
    title: "Automation",
    description: "Intelligent workflow automation to eliminate repetitive tasks",
  },
  {
    icon: Layers,
    title: "Extensible",
    description: "Powerful API and integrations with 500+ third-party applications",
  },
]

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">Powerful Features Built In</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to run your business efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
