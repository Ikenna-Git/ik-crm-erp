import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Modules } from "@/components/modules"
import { Benefits } from "@/components/benefits"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"
import { PricingPreview } from "@/components/pricing-preview"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <Modules />
      <Benefits />
      <PricingPreview />
      <CTA />
      <Footer />
    </main>
  )
}
