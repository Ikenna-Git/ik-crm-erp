import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"
import { getUserFromRequest, isRequestUserError } from "@/lib/request-user"
import { getWorkspaceSetupItems } from "@/lib/launch-readiness"
import {
  deriveWorkspaceMode,
  getWorkspaceIdentityPermissions,
  getWorkspaceModeMeta,
  getWorkspaceRoleLabel,
  getWorkspaceTemplateLabel,
} from "@/lib/workspace-context"
import { listApprovalItemsForOrg } from "@/lib/approval-requests"
import { OPERATING_TEMPLATES, WORKSPACE_INDUSTRIES } from "@/lib/workspace-context"

const dbUnavailable = () =>
  NextResponse.json({ error: "Database not configured. Set DATABASE_URL to enable workspace context." }, { status: 503 })

const buildContextPayload = async (request: Request) => {
  const { org, user } = await getUserFromRequest(request)

  const [contacts, companies, deals, users, approvals, hrPrivacyLocks, accountingPrivacyLocks] = await Promise.all([
    prisma.contact.count({ where: { orgId: org.id } }),
    prisma.company.count({ where: { orgId: org.id } }),
    prisma.deal.count({ where: { orgId: org.id } }),
    prisma.user.count({ where: { orgId: org.id } }),
    listApprovalItemsForOrg(org.id).catch(() => []),
    prisma.orgPrivacyLockSetting.count({ where: { orgId: org.id, module: "hr" } }),
    prisma.orgPrivacyLockSetting.count({ where: { orgId: org.id, module: "accounting" } }),
  ])

  const setupItems = getWorkspaceSetupItems({
    role: user.role,
    email: user.email,
    orgName: org.name,
    logoUrl: org.logoUrl,
    industry: org.industry,
    operatingTemplate: org.operatingTemplate,
    legalBusinessName: org.legalBusinessName,
    businessAddress: org.businessAddress,
    businessEmail: org.businessEmail,
    defaultInvoiceTerms: org.defaultInvoiceTerms,
    defaultInvoiceNotes: org.defaultInvoiceNotes,
    orgStatus: org.status,
    counts: {
      contacts,
      companies,
      deals,
      users,
      hrPrivacyConfigured: hrPrivacyLocks,
      accountingPrivacyConfigured: accountingPrivacyLocks,
      pendingApprovals: approvals.filter((item) => item.status === "pending").length,
      completedApprovals: approvals.filter((item) => item.status !== "pending").length,
    },
  })

  const blockerStatuses = new Set(["action-required", "missing", "blocked"])
  const recommendedStatuses = new Set(["limited", "partial", "test"])
  const blockerItems = setupItems.filter((item) => blockerStatuses.has(item.status))
  const recommendedItems = setupItems.filter((item) => recommendedStatuses.has(item.status))
  const hasCoreSetupGap = setupItems.some((item) =>
    ["company-name", "industry-template", "first-crm-records", "crm-correlation"].includes(item.id) && blockerStatuses.has(item.status),
  )
  const mode = deriveWorkspaceMode({
    orgStatus: org.status,
    blockerCount: blockerItems.length,
    recommendedCount: recommendedItems.length,
    hasCoreSetupGap,
  })
  const modeMeta = getWorkspaceModeMeta(mode, blockerItems.length, recommendedItems.length)
  const permissions = getWorkspaceIdentityPermissions({ role: user.role, email: user.email })

  return {
    org: {
      id: org.id,
      name: org.name,
      logoUrl: org.logoUrl,
      industry: org.industry,
      operatingTemplate: org.operatingTemplate,
      operatingTemplateLabel: getWorkspaceTemplateLabel(org.operatingTemplate),
      theme: org.theme,
      status: org.status,
      notifyEmail: org.notifyEmail,
      legalBusinessName: org.legalBusinessName,
      tradingName: org.tradingName,
      businessEmail: org.businessEmail,
      businessPhone: org.businessPhone,
      businessAddress: org.businessAddress,
      taxNumber: org.taxNumber,
      companyRegistrationNumber: org.companyRegistrationNumber,
      defaultInvoiceTerms: org.defaultInvoiceTerms,
      defaultInvoiceNotes: org.defaultInvoiceNotes,
      paymentInstructions: org.paymentInstructions,
    },
    viewer: {
      id: user.id,
      role: user.role,
      accessProfile: user.accessProfile,
      title: user.title,
      roleLabel: getWorkspaceRoleLabel({
        role: user.role,
        accessProfile: user.accessProfile,
        title: user.title,
        email: user.email,
      }),
      ...permissions,
    },
    launch: {
      mode,
      modeLabel: modeMeta.label,
      summary: modeMeta.summary,
      blockerCount: blockerItems.length,
      reviewCount: recommendedItems.length,
      blockers: blockerItems.slice(0, 3).map((item) => ({
        id: item.id,
        label: item.label,
        status: item.status,
      })),
    },
    setupItems,
  }
}

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    return NextResponse.json(await buildContextPayload(request))
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Workspace context load failed", error)
    return NextResponse.json({ error: "Failed to load workspace context" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!process.env.DATABASE_URL) return dbUnavailable()

  try {
    const { org, user } = await getUserFromRequest(request)
    const permissions = getWorkspaceIdentityPermissions({ role: user.role, email: user.email })
    if (!permissions.canManageIdentity) {
      return NextResponse.json({ error: "You do not have permission to update company identity." }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const name = typeof body?.name === "string" ? body.name.trim() : ""
    const industry = typeof body?.industry === "string" ? body.industry.trim() : ""
    const operatingTemplate = typeof body?.operatingTemplate === "string" ? body.operatingTemplate.trim() : ""
    const theme = typeof body?.theme === "string" ? body.theme.trim() : undefined
    const notifyEmail = typeof body?.notifyEmail === "string" ? body.notifyEmail.trim() : undefined
    const legalBusinessName = typeof body?.legalBusinessName === "string" ? body.legalBusinessName.trim() : undefined
    const tradingName = typeof body?.tradingName === "string" ? body.tradingName.trim() : undefined
    const businessEmail = typeof body?.businessEmail === "string" ? body.businessEmail.trim() : undefined
    const businessPhone = typeof body?.businessPhone === "string" ? body.businessPhone.trim() : undefined
    const businessAddress = typeof body?.businessAddress === "string" ? body.businessAddress.trim() : undefined
    const taxNumber = typeof body?.taxNumber === "string" ? body.taxNumber.trim() : undefined
    const companyRegistrationNumber =
      typeof body?.companyRegistrationNumber === "string" ? body.companyRegistrationNumber.trim() : undefined
    const defaultInvoiceTerms =
      typeof body?.defaultInvoiceTerms === "string" ? body.defaultInvoiceTerms.trim() : undefined
    const defaultInvoiceNotes =
      typeof body?.defaultInvoiceNotes === "string" ? body.defaultInvoiceNotes.trim() : undefined
    const paymentInstructions =
      typeof body?.paymentInstructions === "string" ? body.paymentInstructions.trim() : undefined

    if (!name) {
      return NextResponse.json({ error: "Company or workspace name is required." }, { status: 400 })
    }

    if (!industry) {
      return NextResponse.json({ error: "Industry is required." }, { status: 400 })
    }
    if (!WORKSPACE_INDUSTRIES.includes(industry as (typeof WORKSPACE_INDUSTRIES)[number])) {
      return NextResponse.json({ error: "Choose a valid company industry." }, { status: 400 })
    }

    if (!operatingTemplate) {
      return NextResponse.json({ error: "Primary operating template is required." }, { status: 400 })
    }
    if (!OPERATING_TEMPLATES.some((item) => item.value === operatingTemplate)) {
      return NextResponse.json({ error: "Choose a valid primary operating template." }, { status: 400 })
    }

    if (notifyEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notifyEmail)) {
      return NextResponse.json({ error: "Shared notify email must be a valid email address." }, { status: 400 })
    }
    if (businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      return NextResponse.json({ error: "Business email must be a valid email address." }, { status: 400 })
    }

    const updated = await prisma.org.update({
      where: { id: org.id },
      data: {
        name,
        industry,
        operatingTemplate,
        theme: theme !== undefined ? theme || org.theme : undefined,
        notifyEmail: notifyEmail !== undefined ? notifyEmail || null : undefined,
        legalBusinessName: legalBusinessName !== undefined ? legalBusinessName || null : undefined,
        tradingName: tradingName !== undefined ? tradingName || null : undefined,
        businessEmail: businessEmail !== undefined ? businessEmail || null : undefined,
        businessPhone: businessPhone !== undefined ? businessPhone || null : undefined,
        businessAddress: businessAddress !== undefined ? businessAddress || null : undefined,
        taxNumber: taxNumber !== undefined ? taxNumber || null : undefined,
        companyRegistrationNumber:
          companyRegistrationNumber !== undefined ? companyRegistrationNumber || null : undefined,
        defaultInvoiceTerms: defaultInvoiceTerms !== undefined ? defaultInvoiceTerms || null : undefined,
        defaultInvoiceNotes: defaultInvoiceNotes !== undefined ? defaultInvoiceNotes || null : undefined,
        paymentInstructions: paymentInstructions !== undefined ? paymentInstructions || null : undefined,
      },
    })

    await createAuditLog({
      orgId: org.id,
      userId: user.id,
      action: "workspace.identity.updated",
      entity: "Org",
      entityId: org.id,
      metadata: {
        name: updated.name,
        industry: updated.industry,
        operatingTemplate: updated.operatingTemplate,
        hasLogo: Boolean(updated.logoUrl),
        legalBusinessName: updated.legalBusinessName,
        businessEmail: updated.businessEmail,
      },
    })

    return NextResponse.json({
      message: "Company identity saved.",
      ...(await buildContextPayload(request)),
    })
  } catch (error) {
    if (isRequestUserError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Workspace context update failed", error)
    return NextResponse.json({ error: "Failed to update company identity" }, { status: 500 })
  }
}
