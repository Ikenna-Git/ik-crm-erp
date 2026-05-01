const firstHeaderValue = (value: string | null) => {
  if (!value) return null
  return value
    .split(",")
    .map((part) => part.trim())
    .find(Boolean) || null
}

const normalizeProtocol = (value: string | null) => {
  const protocol = firstHeaderValue(value)?.replace(/:$/, "").toLowerCase()
  if (protocol === "http" || protocol === "https") return protocol
  return null
}

const normalizeHost = (value: string | null) => {
  const host = firstHeaderValue(value)?.toLowerCase()
  return host || null
}

const parseOrigin = (value: string | undefined) => {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export const getPublicOrigin = (request: Request) => {
  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"))
  const forwardedProto = normalizeProtocol(request.headers.get("x-forwarded-proto"))

  if (forwardedHost) {
    return `${forwardedProto || "https"}://${forwardedHost}`
  }

  const host = normalizeHost(request.headers.get("host"))
  if (host) {
    const protocol = normalizeProtocol(request.headers.get("x-forwarded-proto")) || "http"
    return `${protocol}://${host}`
  }

  const envOrigin = parseOrigin(process.env.NEXTAUTH_URL)
  if (envOrigin) return envOrigin

  return new URL(request.url).origin
}
