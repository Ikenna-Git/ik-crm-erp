"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary">Ikenna</div>
            <span className="ml-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ERP & CRM</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="/features" className="text-sm font-medium hover:text-primary transition">
              Features
            </Link>
            <Link href="/modules" className="text-sm font-medium hover:text-primary transition">
              Modules
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-primary transition">
              Pricing
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary transition">
              Docs
            </Link>
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex gap-3 items-center">
            <Button variant="outline" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/features" className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded">
              Features
            </Link>
            <Link href="/modules" className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded">
              Modules
            </Link>
            <Link href="/pricing" className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded">
              Pricing
            </Link>
            <Link href="/docs" className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded">
              Docs
            </Link>
            <div className="pt-2 space-y-2">
              <Button variant="outline" className="w-full bg-transparent" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button className="w-full" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
