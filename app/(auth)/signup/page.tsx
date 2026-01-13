"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getProviders, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [oauthReady, setOauthReady] = useState({ google: false, apple: false })

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders()
      setOauthReady({
        google: Boolean(providers?.google),
        apple: Boolean(providers?.apple),
      })
    }
    loadProviders()
  }, [])

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

      const result = await signIn("credentials", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        mode: "signup",
        redirect: false,
      })
      if (result?.error) {
        setError("Signup failed. Please try again.")
        return
      }
      router.push("/dashboard")
    } catch (err) {
      setError("Signup failed. Please try again.")
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
            <CardTitle className="text-2xl">Get started</CardTitle>
            <CardDescription>Create your account with email or social</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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
                  disabled={loading}
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
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
                disabled={!oauthReady.google}
              >
                <img
                  src="https://www.gstatic.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                {oauthReady.google ? "Continue with Google" : "Google (setup needed)"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-w-[200px] bg-transparent"
                onClick={() => signIn("apple")}
                disabled={!oauthReady.apple}
              >
                <span className="mr-2 text-xl"></span>
                {oauthReady.apple ? "Continue with Apple" : "Apple (setup needed)"}
              </Button>
            </div>

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
