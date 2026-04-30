"use client"

import { useEffect } from "react"

const PWA_CACHE_PREFIX = "civis-"

export function PWAProvider() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    const enablePwa = process.env.NEXT_PUBLIC_ENABLE_PWA === "true"

    const cleanupPwaState = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))

      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.filter((name) => name.startsWith(PWA_CACHE_PREFIX)).map((name) => caches.delete(name)))
      }
    }

    if (!enablePwa) {
      cleanupPwaState().catch((error) => {
        console.warn("Failed to clean up disabled PWA state", error)
      })
      return
    }

    let deferredPrompt: any = null

    const showInstallBanner = () => {
      if (document.getElementById("pwa-install-banner")) return

      const banner = document.createElement("div")
      banner.id = "pwa-install-banner"
      banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: #000;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 1000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `

      banner.innerHTML = `
        <div>
          <strong>Install Civis</strong>
          <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; opacity: 0.9;">
            Get the full experience with our app
          </p>
        </div>
        <div>
          <button id="install-btn" style="
            background: white;
            color: black;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 500;
            cursor: pointer;
            margin-right: 0.5rem;
          ">Install</button>
          <button id="dismiss-btn" style="
            background: transparent;
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
          ">Not now</button>
        </div>
      `

      document.body.appendChild(banner)

      document.getElementById("install-btn")?.addEventListener("click", async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log(`User response to install prompt: ${outcome}`)
          deferredPrompt = null
        }
        banner.remove()
      })

      document.getElementById("dismiss-btn")?.addEventListener("click", () => {
        banner.remove()
        localStorage.setItem("pwa-install-dismissed", Date.now().toString())
      })

      setTimeout(() => {
        if (document.body.contains(banner)) {
          banner.remove()
        }
      }, 10000)
    }

    const dismissedTime = localStorage.getItem("pwa-install-dismissed")
    const hoursSinceDismissed = dismissedTime ? (Date.now() - parseInt(dismissedTime, 10)) / (1000 * 60 * 60) : Infinity

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration.scope)
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error)
      })

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as Event & {
        preventDefault: () => void
        prompt: () => void
        userChoice: Promise<{ outcome: string }>
      }
      promptEvent.preventDefault()
      deferredPrompt = promptEvent

      if (hoursSinceDismissed >= 24) {
        showInstallBanner()
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  return null
}
