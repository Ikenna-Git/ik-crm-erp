import { useCallback, useEffect, useRef, useState } from "react"

type CacheEntry<T> = {
  data: T
  updatedAt: number
}

type CachedFetchState<T> = {
  data: T | null
  loading: boolean
  stale: boolean
  error: string
  refresh: () => Promise<void>
}

const readCache = <T,>(key: string): CacheEntry<T> | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.data || !parsed?.updatedAt) return null
    return parsed
  } catch {
    return null
  }
}

const writeCache = <T,>(key: string, entry: CacheEntry<T>) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore storage errors
  }
}

export const useCachedFetch = <T,>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 1000 * 60 * 10,
): CachedFetchState<T> => {
  const fetchRef = useRef(fetcher)
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRef.current = fetcher
  }, [fetcher])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await fetchRef.current()
      setData(result)
      setStale(false)
      writeCache(key, { data: result, updatedAt: Date.now() })
    } catch (err: any) {
      const cached = readCache<T>(key)
      if (cached?.data) {
        setData(cached.data)
        setStale(true)
      }
      setError(err?.message || "Failed to load data")
    } finally {
      setLoading(false)
    }
  }, [key])

  useEffect(() => {
    const cached = readCache<T>(key)
    if (cached?.data) {
      setData(cached.data)
      const isExpired = Date.now() - cached.updatedAt > ttlMs
      setStale(isExpired)
      setLoading(false)
      if (!isExpired) return
    }
    refresh()
  }, [key, refresh, ttlMs])

  return { data, loading, stale, error, refresh }
}
