"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"

export function Hero() {
  return (
    <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Welcome to Ikenna</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                One Platform. All Your Business.
              </h1>
            </div>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              Streamline your entire business with our unified ERP and CRM platform. Manage customers, finances,
              inventory, projects, and teams—all from one powerful dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" asChild>
                <Link href="/signup" className="flex items-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard/demo" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="pt-4 space-y-2">
              <p className="text-sm text-muted-foreground">✓ 14-day free trial • No credit card required</p>
              <p className="text-sm text-muted-foreground">✓ Deploy on-premise or cloud</p>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-8 border border-border overflow-hidden">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CRM%20ERP%20images-envvRTXj5BVf5hFwFgp6VmGgfUT6cq.webp"
                alt="ERP and CRM Modules"
                width={500}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
