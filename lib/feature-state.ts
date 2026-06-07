export const FEATURE_STATE_COPY = {
  requiresCloudinary: "Requires Cloudinary configuration",
  requiresSmtp: "Requires SMTP configuration",
  requiresAiProvider: "Requires AI provider configuration",
  requiresBillingProvider: "Billing is not live yet",
  previewOnlyMarketing: "Marketing campaign sending is preview-only in this release",
  notAvailableThisRelease: "Not available in this release",
  hrLocked: "You need HR manage access to view this record",
  accountingLocked: "You need Accounting manage access to view this record",
  accessDenied: "You do not have permission for that action",
} as const

export type FeatureStateCopyKey = keyof typeof FEATURE_STATE_COPY
