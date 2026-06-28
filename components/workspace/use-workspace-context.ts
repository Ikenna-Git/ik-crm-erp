"use client"

import { useEffect, useState } from "react"

import { getApiErrorMessage, requestJson } from "@/lib/api-client"
import { type WorkspaceContextResponse, workspaceContextUpdatedEventName } from "@/lib/workspace-context"

export function useWorkspaceContext() {
  const [data, setData] = useState<WorkspaceContextResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    try {
      setLoading(true)
      setError("")
      const payload = await requestJson<WorkspaceContextResponse>("/api/workspace/context")
      setData(payload)
      return payload
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load workspace context"))
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceContextResponse>).detail
      if (detail) {
        setData(detail)
        setLoading(false)
        setError("")
      } else {
        void load()
      }
    }

    window.addEventListener(workspaceContextUpdatedEventName, handleUpdate)
    return () => window.removeEventListener(workspaceContextUpdatedEventName, handleUpdate)
  }, [])

  return {
    data,
    loading,
    error,
    reload: load,
    setData,
  }
}
