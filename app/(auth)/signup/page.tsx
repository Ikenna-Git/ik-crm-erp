"use client"

import type React from "react"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { getProviders, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type InviteDetails = {
  token: string
  email: string
  name: string
  role: "USER" | "ADMIN" | "ORG_OWNER" | "SUPER_ADMIN"
  title?: string | null
  orgName: string
  expiresAt: string
  active: boolean
}

function SignupPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [oauthReady, setOauthReady] = useState({ google: false })
  const [invite, setInvite] = useState<InviteDetails | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const inviteToken = searchParams.get("invite")?.trim() || ""

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders()
      setOauthReady({
        google: Boolean(providers?.google),
      })
    }
    loadProviders()
  }, [])

  useEffect(() => {
    const loadInvite = async () => {
      if (!inviteToken) {
        setInvite(null)
        return
      }

      try {
        setInviteLoading(true)
        setError("")
        const response = await fetch(`/api/invitations/${encodeURIComponent(inviteToken)}`)
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload?.error || "Invite not found or expired")
        setInvite(payload.invite)
        setFormData((current) => ({
          ...current,
          name: payload.invite.name || current.name,
          email: payload.invite.email,
        }))
        if (payload.invite.active) {
          setError("This invite has already been used. Sign in instead.")
        }
      } catch (err) {
        setInvite(null)
        setError(err instanceof Error ? err.message : "Invite not found or expired")
      } finally {
        setInviteLoading(false)
      }
    }

    loadInvite()
  }, [inviteToken])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!formData.name || !formData.email || !formData.password) {
        setError("Please fill in all fields")
        return
      }

      if (inviteToken && !invite) {
        setError("This invite is invalid or expired.")
        return
      }

      if (invite?.active) {
        setError("This invite has already been used. Sign in instead.")
        return
      }

      const signupResponse = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          inviteToken: inviteToken || undefined,
        }),
      })

      const signupData = await signupResponse.json().catch(() => ({}))

      if (!signupResponse.ok) {
        throw new Error(
          signupData?.error ||
            (inviteToken ? "Invite signup failed. Ask your admin to refresh the link." : "Signup failed. Please try again."),
        )
      }

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created, but automatic sign-in failed. Go to login and use the same password.")
        return
      }
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-10">
        <div className="max-w-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              C
            </div>
            <span className="text-2xl font-bold text-primary">Civis</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground">Join the unified CRM/ERP workspace with premium dark mode support.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">{inviteToken ? "Accept your workspace invite" : "Get started"}</CardTitle>
            <CardDescription>
              {inviteToken ? "Create your account to join the workspace your admin prepared for you." : "Create your account with email or social"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {invite ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-foreground">Workspace: {invite.orgName}</p>
                <p className="mt-1 text-muted-foreground">
                  Role on activation: <span className="font-medium text-foreground">{invite.role}</span>
                  {invite.title ? ` • ${invite.title}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Invite expires on {new Date(invite.expiresAt).toLocaleString()}
                </p>
              </div>
            ) : null}

            {inviteLoading ? <p className="text-sm text-muted-foreground">Loading invite details...</p> : null}

            <form onSubmit={handleSignup} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || Boolean(inviteToken)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || inviteLoading || (Boolean(inviteToken) && !invite)}>
                {loading ? "Creating account..." : inviteToken ? "Accept Invite & Create Account" : "Create Account"}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              <span className="h-px flex-1 bg-border" />
              or sign up with
              <span className="h-px flex-1 bg-border" />
            </div>

            <div className="flex flex-row flex-wrap gap-2">
              <Button
                variant="outline"
                className="flex-1 min-w-[200px] bg-transparent"
                onClick={() => signIn("google")}
                disabled={!oauthReady.google || Boolean(inviteToken)}
              >
                <img
                  src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </Button>
            </div>

            {inviteToken ? (
              <p className="text-center text-xs text-muted-foreground">
                Invite acceptance is locked to the email above so your workspace admin keeps the right company boundary.
              </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SignupPageContent />
    </Suspense>
  )
}
