"use client"

import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"
import { CursorStyleToggle } from "@/components/shared/cursor-style-toggle"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="mb-10">
          <CursorStyleToggle />
        </div>
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-primary mb-4">Civis</h3>
            <p className="text-sm text-muted-foreground">The AI-native operating centre for CRM, operations, finance, people, and approvals.</p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/use-cases" className="text-muted-foreground hover:text-foreground transition">
                  Use Cases
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h4 className="font-semibold">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/use-cases" className="text-muted-foreground hover:text-foreground transition">
                  For growing teams
                </Link>
              </li>
              <li>
                <Link href="/trust" className="text-muted-foreground hover:text-foreground transition">
                  Trust & rollout
                </Link>
              </li>
              <li>
                <Link href="/integrations" className="text-muted-foreground hover:text-foreground transition">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="font-semibold">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-foreground transition">
                  Product scope
                </Link>
              </li>
              <li>
                <Link href="/dashboard/docs" className="text-muted-foreground hover:text-foreground transition">
                  Docs
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/trust" className="text-muted-foreground hover:text-foreground transition">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Civis. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="https://x.com" className="text-muted-foreground hover:text-foreground transition" aria-label="X">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="https://linkedin.com" className="text-muted-foreground hover:text-foreground transition" aria-label="LinkedIn">
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link href="https://github.com/Ikenna-Git/ik-crm-erp" className="text-muted-foreground hover:text-foreground transition" aria-label="GitHub">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
