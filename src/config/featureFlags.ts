// Centralized feature flags (read from env)

export const featureFlags = {
  // Raptor mini (Preview) is enabled by default for all clients unless explicitly set to 'false'
  raptorMini: (process.env.NEXT_PUBLIC_ENABLE_RAPTOR_MINI ?? 'true') === 'true',
}
