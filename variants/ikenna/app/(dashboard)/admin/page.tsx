"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Users, Settings, BarChart3, Lock } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isUnauthorized, setIsUnauthorized] = useState(false)

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      if (parsedUser.role === "admin") {
        setUser(parsedUser)
      } else {
        setIsUnauthorized(true)
      }
    } else {
      router.push("/login")
    }
  }, [router])

  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Access Denied</CardTitle>
            </div>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) return <div>Loading...</div>

  const adminSections = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      stats: "24 Active Users",
    },
    {
      title: "System Settings",
      description: "Configure platform settings and integrations",
      icon: Settings,
      stats: "5 Integrations",
    },
    {
      title: "Analytics & Reports",
      description: "View platform-wide analytics and reports",
      icon: BarChart3,
      stats: "12 Reports Available",
    },
    {
      title: "Security & Compliance",
      description: "Security settings, audit logs, and compliance",
      icon: Lock,
      stats: "99.9% Uptime",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Logged in as: {user.email}</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Welcome, Administrator</CardTitle>
              <CardDescription>You have full access to platform administration tools and settings.</CardDescription>
            </CardHeader>
          </Card>

          {/* Admin Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {adminSections.map((section, index) => {
              const Icon = section.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <CardDescription>{section.description}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground">{section.stats}</p>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">2,453</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Companies</p>
                  <p className="text-2xl font-bold">1,248</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-2xl font-bold">₦12.5M</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">System Uptime</p>
                  <p className="text-2xl font-bold">99.9%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
