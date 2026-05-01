"use client"

import Link from "next/link"
import { ArrowRight, Bot, Cloud, CreditCard, Mail, ShieldCheck, Webhook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const integrationGroups = [
  {
    icon: Bot,
    title: "AI providers",
    status: "Config ready",
    items: ["OpenAI", "Anthropic", "Gemini", "Assistant routing and fallback flow"],
  },
  {
    icon: Mail,
    title: "Email and alerts",
    status: "Config ready",
    items: ["SMTP digests", "Invite and alert delivery", "Security notices", "Ops reminders"],
  },
  {
    icon: Cloud,
    title: "Files and media",
    status: "Config ready",
    items: ["Cloudinary uploads", "Portal document sharing", "Client-facing assets", "Media-backed workflows"],
  },
  {
    icon: Webhook,
    title: "Automation and APIs",
    status: "Live foundation",
    items: ["Webhook endpoints", "Operations workflows", "Playbooks", "OpenAPI docs"],
  },
  {
    icon: CreditCard,
    title: "Payments and finance",
    status: "Next rollout",
    items: ["Paystack direction", "Invoice collections", "Expense and finance flows", "Regional payment support"],
  },
  {
    icon: ShieldCheck,
    title: "Identity and control",
    status: "Live foundation",
    items: ["Credentials auth", "Google OAuth path", "2FA support", "Founder and workspace admin boundaries"],
  },
]

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-bold text-sm">C</span>
            </div>
            <span className="font-semibold text-primary">Civis</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/use-cases">Use cases</Link>
            </Button>
            <Button asChild>
              <Link href="/trust">Trust guide</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-14 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
          <div className="space-y-5">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Integrations and extensibility</Badge>
            <h1 className="text-4xl font-semibold sm:text-5xl lg:text-6xl">Civis should connect like a platform, not behave like a dead end.</h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              A credible business platform needs more than internal pages. It needs AI, email, file storage, webhooks,
              finance paths, and a clear story about what is live now versus what is next.
            </p>
          </div>

          <div className="rounded-[30px] border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium text-foreground">How to read this page</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              <p><strong>Live foundation</strong> means the product path exists in the app now.</p>
              <p><strong>Config ready</strong> means the app supports it, but your environment keys still matter.</p>
              <p><strong>Next rollout</strong> means it belongs in the product path, but still needs the next implementation pass.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {integrationGroups.map((group) => {
            const Icon = group.icon
            return (
              <Card key={group.title} className="rounded-[30px] border-border/80 bg-card shadow-sm">
                <CardHeader className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline" className="border-border/80 bg-background/80 text-foreground">
                      {group.status}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{group.title}</CardTitle>
                    <CardDescription className="mt-2 text-sm leading-7">
                      The integration layer here should feel explicit and trustworthy, not implied.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.items.map((item) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent" />
                      <span>{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="rounded-[32px] border border-border/80 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.08] p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold">What matters to buyers here</h2>
              <p className="text-base leading-7 text-muted-foreground">
                Buyers want to know that the product can connect to email, AI, storage, payments, and workflows without
                becoming another locked silo. This page is now part of that answer.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/docs/api">
                Open API docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
