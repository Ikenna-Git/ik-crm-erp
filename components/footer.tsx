"use client"

import Link from "next/link"
import { Github, Linkedin, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold text-primary mb-4">Civis</h3>
            <p className="text-sm text-muted-foreground">The complete platform for business management</p>
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
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h4 className="font-semibold">Solutions</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  For SMB
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  For Enterprise
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
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
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">© 2025 Civis. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-foreground transition">
              <Twitter className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition">
              <Linkedin className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition">
              <Github className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
