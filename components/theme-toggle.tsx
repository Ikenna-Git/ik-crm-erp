"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { preferencesUpdatedEventName } from "@/lib/user-settings"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    const initial = (stored as "light" | "dark") || (prefersDark ? "dark" : "light")
    setTheme(initial)
    document.documentElement.classList.toggle("dark", initial === "dark")
    setMounted(true)
  }, [])

  useEffect(() => {
    const syncTheme = () => {
      const stored = localStorage.getItem("theme")
      if (stored === "light" || stored === "dark") {
        setTheme(stored)
        document.documentElement.classList.toggle("dark", stored === "dark")
      }
    }
    window.addEventListener(preferencesUpdatedEventName, syncTheme)
    window.addEventListener("storage", syncTheme)
    return () => {
      window.removeEventListener(preferencesUpdatedEventName, syncTheme)
      window.removeEventListener("storage", syncTheme)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark"
    setTheme(next)
    document.documentElement.classList.toggle("dark", next === "dark")
    localStorage.setItem("theme", next)
  }

  if (!mounted) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
      className="bg-transparent"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  )
}
