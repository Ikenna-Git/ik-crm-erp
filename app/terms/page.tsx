"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-primary">Civis</span>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        <p className="text-muted-foreground mb-8">Last updated: November 2025</p>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using the Civis platform, you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. License to Use Platform</h2>
            <p>
              Civis grants you a limited, non-exclusive, non-transferable license to access and use the platform
              according to the subscription plan you have purchased. This license does not include the right to:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
              <li>Modify or copy any materials from the platform</li>
              <li>Use materials for any commercial purpose without written permission</li>
              <li>Attempt to decompile or reverse engineer any software contained on the platform</li>
              <li>Transmit or distribute any unauthorized data or viruses</li>
              <li>Remove any copyright or other proprietary notations from the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts and Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account information and password and for
              restricting access to your computer. You agree to accept responsibility for all activities that occur
              under your account or password. You must notify Civis immediately of any unauthorized uses of your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Privacy and Protection</h2>
            <p>
              Your use of the platform is also governed by our Privacy Policy. Civis takes data security seriously and
              implements industry-standard security measures. However, no method of transmission over the internet is
              100% secure. By using Civis, you acknowledge and agree to this inherent risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Limitations of Liability</h2>
            <p>
              Civis and its suppliers will not be liable for any damages (including, without limitation, damages for
              loss of data or profit, or due to business interruption) arising out of the use or inability to use the
              materials on Civis's platform, even if Civis or an authorized representative has been notified orally or
              in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Accuracy of Materials</h2>
            <p>
              The materials appearing on Civis's platform could include technical, typographical, or photographic
              errors. Civis does not warrant that any of the materials on its platform are accurate, complete, or
              current. Civis may make changes to the materials contained on its platform at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Links and Third-Party Services</h2>
            <p>
              Civis has not reviewed all of the sites linked to its platform and is not responsible for the contents of
              any such linked site. The inclusion of any link does not imply endorsement by Civis of the site. Use of
              any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Modifications to Terms</h2>
            <p>
              Civis may revise these terms of service for its platform at any time without notice. By using this
              platform, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Governing Law</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of Nigeria, and you
              irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Information</h2>
            <p>If you have any questions about these Terms and Conditions, please contact us at:</p>
            <ul className="mt-2 space-y-2">
              <li>Email: support@civis.ng</li>
              <li>Address: Lagos, Nigeria</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
