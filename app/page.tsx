import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Modules } from "@/components/modules"
import { Benefits } from "@/components/benefits"
import { CTA } from "@/components/cta"
import { Footer } from "@/components/footer"
import { PricingPreview } from "@/components/pricing-preview"
import { ProofShowcase } from "@/components/proof-showcase"
import { UseCasePreview } from "@/components/use-case-preview"
import { LandingStory } from "@/components/landing-story"
import { LandingFaq } from "@/components/landing-faq"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <LandingStory />
      <Features />
      <Modules />
      <ProofShowcase />
      <Benefits />
      <UseCasePreview />
      <PricingPreview />
      <LandingFaq />
      <CTA />
      <Footer />
    </main>
  )
}
