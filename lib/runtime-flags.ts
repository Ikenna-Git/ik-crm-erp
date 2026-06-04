export const isDevelopment = process.env.NODE_ENV === "development"

export const allowDevHeaderIdentity = isDevelopment && process.env.ALLOW_DEV_HEADER_IDENTITY === "true"

export const allowDevDefaultIdentity = isDevelopment && process.env.ALLOW_DEV_DEFAULT_IDENTITY === "true"

export const allowDevAuthFallback =
  isDevelopment &&
  (process.env.NEXTAUTH_ALLOW_DEV_FALLBACK === "true" || process.env.NEXTAUTH_ALLOW_FALLBACK === "true")

export const allowDemoMode = isDevelopment && process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === "true"
