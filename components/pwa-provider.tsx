"use client"

import { useEffect } from "react"

export function PWAProvider() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope)
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error)
        })

      // Handle PWA install prompt
      let deferredPrompt: any

      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e

        // Show install button or banner
        showInstallBanner()
      })

      const showInstallBanner = () => {
        // Create install banner
        const banner = document.createElement('div')
        banner.id = 'pwa-install-banner'
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

        // Handle install button
        document.getElementById('install-btn')?.addEventListener('click', async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            console.log(`User response to install prompt: ${outcome}`)
            deferredPrompt = null
          }
          banner.remove()
        })

        // Handle dismiss button
        document.getElementById('dismiss-btn')?.addEventListener('click', () => {
          banner.remove()
          // Don't show again for 24 hours
          localStorage.setItem('pwa-install-dismissed', Date.now().toString())
        })

        // Auto-hide after 10 seconds
        setTimeout(() => {
          if (document.body.contains(banner)) {
            banner.remove()
          }
        }, 10000)
      }

      // Check if user has already dismissed install banner recently
      const dismissedTime = localStorage.getItem('pwa-install-dismissed')
      if (dismissedTime) {
        const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60)
        if (hoursSinceDismissed < 24) {
          return // Don't show banner again
        }
      }
    }
  }, [])

  return null
}