"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Shield, QrCode, Key, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function TwoFactorAuthPage() {
  const { data: session, update } = useSession()
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCode: string
    backupCodes: string[]
  } | null>(null)
  const [verificationToken, setVerificationToken] = useState("")
  const [showSetup, setShowSetup] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (session?.user?.twoFactorEnabled) {
      setIsEnabled(true)
    }
  }, [session])

  const handleSetup2FA = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to setup 2FA")
      }

      setSetupData(data)
      setShowSetup(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to setup 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!verificationToken) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify 2FA")
      }

      setIsEnabled(true)
      setShowSetup(false)
      setSetupData(null)
      setVerificationToken("")
      await update() // Refresh session
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify 2FA")
    } finally {
      setLoading(false)
    }
  }

  const handleDisable2FA = async () => {
    const password = prompt("Enter your password to disable 2FA:")
    if (!password) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to disable 2FA")
      }

      setIsEnabled(false)
      await update() // Refresh session
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disable 2FA")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account with 2FA.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>
            Manage your two-factor authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {isEnabled
                  ? "Your account is protected with 2FA"
                  : "Add an extra layer of security to your account"
                }
              </p>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!isEnabled ? (
              <Button onClick={handleSetup2FA} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                {loading ? "Setting up..." : "Enable 2FA"}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleDisable2FA} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                {loading ? "Disabling..." : "Disable 2FA"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Set up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the verification code.
            </DialogDescription>
          </DialogHeader>

          {setupData && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Verification Code</Label>
                <Input
                  id="token"
                  placeholder="Enter 6-digit code"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Backup Codes</Label>
                <p className="text-sm text-muted-foreground">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  {setupData.backupCodes.map((code, index) => (
                    <code key={index} className="text-sm font-mono">
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleVerify2FA}
                disabled={loading || verificationToken.length !== 6}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify & Enable"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}