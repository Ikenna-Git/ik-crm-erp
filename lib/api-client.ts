"use client"

export class ApiClientError extends Error {
  status: number
  payload: unknown

  constructor(message: string, status = 0, payload?: unknown) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
    this.payload = payload
  }
}

type ValidationIssue = {
  message?: string
  path?: string[] | string
}

const UNKNOWN_ERROR = "Something went wrong. Please try again."

const flattenValidationIssues = (issues: unknown) => {
  if (!Array.isArray(issues)) return []
  return issues
    .map((issue) => {
      if (typeof issue === "string") return issue
      if (issue && typeof issue === "object") {
        const typedIssue = issue as ValidationIssue
        const path = Array.isArray(typedIssue.path)
          ? typedIssue.path.join(".")
          : typeof typedIssue.path === "string"
            ? typedIssue.path
            : ""
        const message = typeof typedIssue.message === "string" ? typedIssue.message : ""
        if (path && message) return `${path}: ${message}`
        return message
      }
      return ""
    })
    .filter(Boolean)
}

const extractMessageFromPayload = (payload: unknown): string | null => {
  if (!payload) return null
  if (typeof payload === "string") return payload

  if (typeof payload === "object") {
    const typedPayload = payload as Record<string, unknown>
    const directMessage =
      typeof typedPayload.error === "string"
        ? typedPayload.error
        : typeof typedPayload.message === "string"
          ? typedPayload.message
          : typeof typedPayload.detail === "string"
            ? typedPayload.detail
            : null

    if (directMessage) return directMessage

    const issues = flattenValidationIssues(
      typedPayload.issues ?? typedPayload.errors ?? typedPayload.validationErrors ?? typedPayload.validation,
    )
    if (issues.length > 0) return issues.join(". ")
  }

  return null
}

const messageFromStatus = (status: number) => {
  if (status === 401) return "You need to sign in again to continue."
  if (status === 403) return "You do not have permission to do that."
  if (status === 404) return "The item you are trying to reach no longer exists."
  if (status === 408) return "The request timed out. Please try again."
  if (status === 429) return "Too many attempts. Please wait a moment and try again."
  if (status >= 500) return "The server hit a problem. Please try again."
  return UNKNOWN_ERROR
}

export const parseJsonSafely = async (response: Response) => {
  const text = await response.text()
  if (!text.trim()) return null

  try {
    return JSON.parse(text)
  } catch {
    if (response.ok) {
      return text
    }
    throw new ApiClientError("The server returned an unreadable response.", response.status, text.slice(0, 300))
  }
}

export const getApiErrorMessage = (error: unknown, fallback = UNKNOWN_ERROR) => {
  if (error instanceof ApiClientError) return error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const requestJson = async <T>(input: RequestInfo | URL, init?: RequestInit) => {
  let response: Response

  try {
    response = await fetch(input, init)
  } catch (error) {
    throw new ApiClientError("Network issue. Check your connection and try again.")
  }

  const payload = await parseJsonSafely(response)
  if (!response.ok) {
    throw new ApiClientError(extractMessageFromPayload(payload) || messageFromStatus(response.status), response.status, payload)
  }

  return payload as T
}
