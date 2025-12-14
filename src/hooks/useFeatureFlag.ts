import { useEffect, useState } from 'react'

export type FeatureFlags = {
  raptorMini: boolean
}

// Client hook to fetch feature flags. Falls back to window.__FEATURE_FLAGS__ or env var.
export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlags>(() => ({
    // Default to enabled so the Raptor mini (Preview) experience is on for all clients
    raptorMini: (process.env.NEXT_PUBLIC_ENABLE_RAPTOR_MINI ?? 'true') === 'true',
  }))

  useEffect(() => {
    // Attempt to fetch dynamic flags from API if available (non-blocking)
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/feature-flags')
        if (!res.ok) return
        const json = await res.json()
        if (mounted) setFlags(json.flags)
      } catch (err) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return flags
}
