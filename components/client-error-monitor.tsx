"use client"

import { useEffect } from "react"

const reportedFingerprints = new Set<string>()

const normalizeReason = (reason: unknown) => {
  if (reason instanceof Error) {
    return {
      message: reason.message || "Unhandled promise rejection",
      stack: reason.stack || "",
    }
  }

  if (typeof reason === "string") {
    return {
      message: reason,
      stack: "",
    }
  }

  try {
    return {
      message: JSON.stringify(reason) || "Unhandled promise rejection",
      stack: "",
    }
  } catch {
    return {
      message: "Unhandled promise rejection",
      stack: "",
    }
  }
}

const buildFingerprint = (message: string, source: string, href: string) => `${message}::${source}::${href}`

const reportClientError = async ({
  message,
  stack,
  source,
}: {
  message: string
  stack?: string
  source: string
}) => {
  if (!message || typeof window === "undefined") return

  const href = window.location.href
  const fingerprint = buildFingerprint(message, source, href)
  if (reportedFingerprints.has(fingerprint)) return

  reportedFingerprints.add(fingerprint)
  if (reportedFingerprints.size > 100) {
    reportedFingerprints.clear()
    reportedFingerprints.add(fingerprint)
  }

  const payload = JSON.stringify({
    message,
    stack: stack || "",
    source,
    href,
  })

  try {
    await fetch("/api/telemetry/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    })
  } catch {
    // Ignore telemetry transport failures.
  }
}

export function ClientErrorMonitor() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const source = event.filename
        ? `window.error:${event.filename}:${event.lineno}:${event.colno}`
        : "window.error"
      void reportClientError({
        message: event.message || event.error?.message || "Unhandled window error",
        stack: event.error?.stack,
        source,
      })
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = normalizeReason(event.reason)
      void reportClientError({
        message: reason.message,
        stack: reason.stack,
        source: "window.unhandledrejection",
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
