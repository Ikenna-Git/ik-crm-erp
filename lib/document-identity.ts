import type { Invoice, Org } from "@prisma/client"

import type { WorkspaceDocumentIdentity } from "@/lib/workspace-context"

export const buildDocumentIdentityFromOrg = (org: Pick<
  Org,
  | "name"
  | "logoUrl"
  | "legalBusinessName"
  | "tradingName"
  | "businessEmail"
  | "businessPhone"
  | "businessAddress"
  | "taxNumber"
  | "companyRegistrationNumber"
  | "defaultInvoiceTerms"
  | "defaultInvoiceNotes"
  | "paymentInstructions"
>): WorkspaceDocumentIdentity => ({
  workspaceDisplayName: org.name || null,
  logoUrl: org.logoUrl || null,
  legalBusinessName: org.legalBusinessName || org.name || null,
  tradingName: org.tradingName || null,
  businessEmail: org.businessEmail || null,
  businessPhone: org.businessPhone || null,
  businessAddress: org.businessAddress || null,
  taxNumber: org.taxNumber || null,
  companyRegistrationNumber: org.companyRegistrationNumber || null,
  defaultInvoiceTerms: org.defaultInvoiceTerms || null,
  defaultInvoiceNotes: org.defaultInvoiceNotes || null,
  paymentInstructions: org.paymentInstructions || null,
})

export const parseInvoiceDocumentIdentitySnapshot = (invoice: Pick<Invoice, "documentIdentitySnapshot">) => {
  const value = invoice.documentIdentitySnapshot
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const typed = value as Record<string, unknown>
  return {
    workspaceDisplayName: typeof typed.workspaceDisplayName === "string" ? typed.workspaceDisplayName : null,
    logoUrl: typeof typed.logoUrl === "string" ? typed.logoUrl : null,
    legalBusinessName: typeof typed.legalBusinessName === "string" ? typed.legalBusinessName : null,
    tradingName: typeof typed.tradingName === "string" ? typed.tradingName : null,
    businessEmail: typeof typed.businessEmail === "string" ? typed.businessEmail : null,
    businessPhone: typeof typed.businessPhone === "string" ? typed.businessPhone : null,
    businessAddress: typeof typed.businessAddress === "string" ? typed.businessAddress : null,
    taxNumber: typeof typed.taxNumber === "string" ? typed.taxNumber : null,
    companyRegistrationNumber: typeof typed.companyRegistrationNumber === "string" ? typed.companyRegistrationNumber : null,
    defaultInvoiceTerms: typeof typed.defaultInvoiceTerms === "string" ? typed.defaultInvoiceTerms : null,
    defaultInvoiceNotes: typeof typed.defaultInvoiceNotes === "string" ? typed.defaultInvoiceNotes : null,
    paymentInstructions: typeof typed.paymentInstructions === "string" ? typed.paymentInstructions : null,
  } satisfies WorkspaceDocumentIdentity
}

export const shouldFreezeInvoiceDocumentIdentity = (status?: string | null) =>
  status === "SENT" || status === "PAID" || status === "OVERDUE"
