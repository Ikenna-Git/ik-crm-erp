"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ArrowRight, Users, Building, DollarSign, FileText, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const onboardingSteps = [
  {
    id: "welcome",
    title: "Welcome to Civis!",
    description: "Let's get you set up with your CRM & ERP platform.",
    icon: CheckCircle,
    action: "Get Started"
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add your personal information and preferences.",
    icon: Users,
    action: "Update Profile",
    href: "/dashboard/profile"
  },
  {
    id: "company",
    title: "Add Your Company",
    description: "Set up your organization details and branding.",
    icon: Building,
    action: "Add Company",
    href: "/dashboard/crm"
  },
  {
    id: "contacts",
    title: "Import Contacts",
    description: "Add your first contacts to start building relationships.",
    icon: Users,
    action: "Add Contacts",
    href: "/dashboard/crm"
  },
  {
    id: "invoice",
    title: "Create Your First Invoice",
    description: "Generate professional invoices for your business.",
    icon: DollarSign,
    action: "Create Invoice",
    href: "/dashboard/accounting"
  },
  {
    id: "settings",
    title: "Configure Settings",
    description: "Customize your dashboard and notification preferences.",
    icon: Settings,
    action: "Open Settings",
    href: "/dashboard/settings"
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "Explore Civis and discover all the powerful features available.",
    icon: CheckCircle,
    action: "Explore Dashboard"
  }
]

export function GuidedOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem("onboarding_completed")
    const completedStepsData = localStorage.getItem("onboarding_steps")

    if (!onboardingCompleted) {
      setShowOnboarding(true)
    }

    if (completedStepsData) {
      setCompletedSteps(JSON.parse(completedStepsData))
    }
  }, [])

  const handleStepComplete = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId]
    setCompletedSteps(newCompleted)
    localStorage.setItem("onboarding_steps", JSON.stringify(newCompleted))

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleStepAction = () => {
    const step = onboardingSteps[currentStep]

    if (step.href) {
      router.push(step.href)
      handleStepComplete(step.id)
    } else if (step.id === "welcome") {
      setCurrentStep(1)
    } else if (step.id === "complete") {
      localStorage.setItem("onboarding_completed", "true")
      setShowOnboarding(false)
    }
  }

  const skipOnboarding = () => {
    localStorage.setItem("onboarding_completed", "true")
    setShowOnboarding(false)
  }

  const progress = (completedSteps.length / (onboardingSteps.length - 1)) * 100

  if (!showOnboarding) return null

  const CurrentIcon = onboardingSteps[currentStep].icon

  return (
    <Dialog open={showOnboarding} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CurrentIcon className="h-5 w-5 text-primary" />
                {onboardingSteps[currentStep].title}
              </DialogTitle>
              <DialogDescription className="mt-2">
                {onboardingSteps[currentStep].description}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={skipOnboarding}>
              Skip
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{completedSteps.length} of {onboardingSteps.length - 1} completed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {onboardingSteps.slice(0, -1).map((step, index) => {
              const isCompleted = completedSteps.includes(step.id)
              const isCurrent = index === currentStep

              return (
                <Card
                  key={step.id}
                  className={`p-3 ${
                    isCompleted
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : isCurrent
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      isCompleted
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
                        : isCurrent
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <step.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{step.title}</p>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button onClick={handleStepAction}>
              {onboardingSteps[currentStep].action}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
