"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Award, Users, TrendingUp } from "lucide-react"

export function CTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-primary/90 to-accent/90 rounded-2xl p-12 lg:p-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Heading and Buttons */}
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground">
                Ready to Transform Your Business?
              </h2>
              <p className="text-lg text-primary-foreground/90">
                Start your 14-day free trial today. No credit card required. Full access to all modules.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" asChild variant="secondary">
                  <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/dashboard/demo">Schedule Demo</Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Trust Elements and Social Proof */}
            <div className="space-y-8">
              {/* Trust Badges */}
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wide">
                  Enterprise Grade Security
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-primary-foreground/20 px-4 py-2 rounded-full text-sm text-primary-foreground font-medium">
                    SOC 2 Certified
                  </div>
                  <div className="bg-primary-foreground/20 px-4 py-2 rounded-full text-sm text-primary-foreground font-medium">
                    GDPR Compliant
                  </div>
                  <div className="bg-primary-foreground/20 px-4 py-2 rounded-full text-sm text-primary-foreground font-medium">
                    ISO 27001
                  </div>
                </div>
              </div>

              {/* Feature Highlights */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">Instant setup - get started in minutes</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">24/7 customer support included</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">99.9% uptime guarantee</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-foreground/20">
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-foreground">10K+</span>
                    <Users className="w-4 h-4 text-primary-foreground/80" />
                  </div>
                  <p className="text-sm text-primary-foreground/80">Active Users</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-foreground">4.9/5</span>
                    <Award className="w-4 h-4 text-primary-foreground/80" />
                  </div>
                  <p className="text-sm text-primary-foreground/80">Customer Rating</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary-foreground">50+</span>
                    <TrendingUp className="w-4 h-4 text-primary-foreground/80" />
                  </div>
                  <p className="text-sm text-primary-foreground/80">Countries</p>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary-foreground">14 days</div>
                  <p className="text-sm text-primary-foreground/80">Free Trial</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
