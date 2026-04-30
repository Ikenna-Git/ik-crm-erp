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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [oauthReady, setOauthReady] = useState({ google: false })
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorToken, setTwoFactorToken] = useState("")

  useEffect(() => {
    const loadProviders = async () => {
      const providers = await getProviders()
      setOauthReady({
        google: Boolean(providers?.google),
      })
    }
    loadProviders()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (!email || !password) {
        setError("Please enter email and password")
        return
      }

      if (requires2FA) {
        setError("Enter your 2FA code below to continue.")
        return
      }

      const precheckResponse = await fetch("/api/auth/login/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const precheckData = await precheckResponse.json()

      if (!precheckResponse.ok) {
        throw new Error(precheckData.error || "Login failed. Please try again.")
      }

      if (precheckData?.requires2FA) {
        setRequires2FA(true)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Login failed. Please try again.")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!twoFactorToken || twoFactorToken.trim().length < 6) return

    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        twoFactorToken,
        redirect: false,
      })

      if (result?.error) {
        throw new Error("Invalid 2FA code")
      }

      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed")
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
          <h1 className="text-3xl font-bold text-foreground">Sign in to the premium dashboard</h1>
          <p className="text-muted-foreground">
            Access CRM, ERP, analytics, and more in one place. Toggle dark/light in profile after login.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <Card className="w-full max-w-2xl shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your workspace</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {requires2FA && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="twoFactorToken">Two-Factor Authentication</Label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder="Enter authenticator or backup code"
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value)}
                    maxLength={12}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit app code or an 8-character backup code
                  </p>
                </div>
                <Button
                  onClick={handleVerify2FA}
                  className="w-full"
                  disabled={loading || twoFactorToken.trim().length < 6}
                >
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRequires2FA(false)
                    setTwoFactorToken("")
                  }}
                  className="w-full"
                >
                  Back to Login
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
              <span className="h-px flex-1 bg-border" />
              or sign in with
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
                Continue with Google
              </Button>
            </div>

            <div className="text-center text-sm space-y-2">
              <p className="text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
              <Link href="#" className="text-primary hover:underline text-xs">
                Forgot password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
