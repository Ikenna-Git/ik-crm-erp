import { prisma } from "@/lib/prisma"
import type { Contact, Deal, Expense, Invoice } from "@prisma/client"

export type DecisionSnapshot = Record<string, any>

export const createDecisionTrail = async (payload: {
  orgId: string
  userId?: string | null
  action: string
  entity: string
  entityId?: string | null
  before?: DecisionSnapshot | null
  after?: DecisionSnapshot | null
  metadata?: DecisionSnapshot | null
}) => {
  return prisma.decisionTrail.create({
    data: {
      orgId: payload.orgId,
      userId: payload.userId || null,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId || null,
      before: payload.before ?? null,
      after: payload.after ?? null,
      metadata: payload.metadata ?? null,
    },
  })
}

export const contactSnapshot = (contact: Contact) => ({
  name: contact.name,
  email: contact.email,
  phone: contact.phone,
  status: contact.status,
  revenue: contact.revenue,
  lastContact: contact.lastContact ? contact.lastContact.toISOString() : null,
  notes: contact.notes,
  tags: contact.tags,
  customFields: contact.customFields ?? null,
  companyId: contact.companyId,
  ownerId: contact.ownerId,
})

export const dealSnapshot = (deal: Deal) => ({
  title: deal.title,
  value: deal.value,
  stage: deal.stage,
  expectedClose: deal.expectedClose ? deal.expectedClose.toISOString() : null,
  customFields: deal.customFields ?? null,
  companyId: deal.companyId,
  contactId: deal.contactId,
  ownerId: deal.ownerId,
})

export const invoiceSnapshot = (invoice: Invoice) => ({
  invoiceNumber: invoice.invoiceNumber,
  clientName: invoice.clientName,
  amount: invoice.amount,
  status: invoice.status,
  issueDate: invoice.issueDate ? invoice.issueDate.toISOString() : null,
  dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
})

export const expenseSnapshot = (expense: Expense) => ({
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  status: expense.status,
  submittedBy: expense.submittedBy,
  date: expense.date ? expense.date.toISOString() : null,
})

export const restoreDateField = (value?: string | null) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}
