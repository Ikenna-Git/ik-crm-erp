import { prisma } from "@/lib/prisma"
import type { ReportRow } from "@/lib/reports"

const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const VAT_RATE = 0.075

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

const buildMonthRange = (count: number) => {
  const now = new Date()
  const months = []
  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: getMonthKey(date),
      label: monthLabels[date.getMonth()],
      date,
    })
  }
  return months
}

const safeDate = (value?: Date | string | null) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const buildAccountingRows = async (orgId: string): Promise<ReportRow[]> => {
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: { orgId }, orderBy: { createdAt: "desc" } }),
  ])

  const invoiceRows = invoices.map((invoice) => ({
    type: "invoice",
    reference: invoice.invoiceNumber,
    client: invoice.clientName,
    amount: invoice.amount,
    status: invoice.status,
    date: (invoice.issueDate || invoice.createdAt).toISOString().slice(0, 10),
  }))

  const expenseRows = expenses.map((expense) => ({
    type: "expense",
    reference: expense.description,
    client: expense.category,
    amount: expense.amount,
    status: expense.status,
    date: (expense.date || expense.createdAt).toISOString().slice(0, 10),
  }))

  return [...invoiceRows, ...expenseRows]
}

export const buildCrmRows = async (orgId: string): Promise<ReportRow[]> => {
  const [deals, contacts] = await Promise.all([
    prisma.deal.findMany({ where: { orgId }, include: { company: true }, orderBy: { updatedAt: "desc" } }),
    prisma.contact.findMany({ where: { orgId }, include: { company: true }, orderBy: { updatedAt: "desc" } }),
  ])

  const dealRows = deals.map((deal) => ({
    type: "deal",
    title: deal.title,
    company: deal.company?.name || "",
    value: deal.value,
    stage: deal.stage,
    expectedClose: deal.expectedClose ? deal.expectedClose.toISOString().slice(0, 10) : "",
  }))

  const contactRows = contacts.map((contact) => ({
    type: "contact",
    name: contact.name,
    company: contact.company?.name || "",
    status: contact.status,
    email: contact.email,
    lastContact: contact.lastContact ? contact.lastContact.toISOString().slice(0, 10) : "",
  }))

  return [...dealRows, ...contactRows]
}

export const buildVatRows = async (orgId: string): Promise<ReportRow[]> => {
  const vatRate = 0.075
  const invoices = await prisma.invoice.findMany({
    where: { orgId, status: { in: ["PAID", "SENT", "OVERDUE"] } },
    orderBy: { createdAt: "desc" },
  })

  return invoices.map((invoice) => {
    const amount = invoice.amount || 0
    const vatDue = Math.round(amount * vatRate)
    return {
      invoice: invoice.invoiceNumber,
      client: invoice.clientName,
      amount,
      vatRate: "7.5%",
      vatDue,
      issueDate: (invoice.issueDate || invoice.createdAt).toISOString().slice(0, 10),
      status: invoice.status,
    }
  })
}

export const buildAuditRows = async (orgId: string): Promise<ReportRow[]> => {
  const logs = await prisma.auditLog.findMany({
    where: { orgId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return logs.map((log) => ({
    timestamp: log.createdAt.toISOString(),
    user: log.user?.email || log.user?.name || "System",
    action: log.action,
    entity: log.entity || "",
    entityId: log.entityId || "",
    metadata: log.metadata ? JSON.stringify(log.metadata) : "",
  }))
}

export const buildAccountingSummary = async (orgId: string) => {
  const months = buildMonthRange(6)
  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: { orgId } }),
    prisma.expense.findMany({ where: { orgId } }),
  ])

  const monthMap = new Map(
    months.map((month) => [
      month.key,
      { month: month.label, revenue: 0, expenses: 0, profit: 0 },
    ]),
  )

  invoices.forEach((invoice) => {
    const date = safeDate(invoice.issueDate) || invoice.createdAt
    const key = getMonthKey(date)
    const entry = monthMap.get(key)
    if (!entry) return
    if (["PAID", "SENT", "OVERDUE"].includes(invoice.status)) {
      entry.revenue += invoice.amount
    }
  })

  expenses.forEach((expense) => {
    const date = safeDate(expense.date) || expense.createdAt
    const key = getMonthKey(date)
    const entry = monthMap.get(key)
    if (!entry) return
    entry.expenses += expense.amount
  })

  monthMap.forEach((entry) => {
    entry.profit = entry.revenue - entry.expenses
  })

  const breakdownMap = new Map<string, number>()
  expenses.forEach((expense) => {
    const key = expense.category || "Other"
    breakdownMap.set(key, (breakdownMap.get(key) || 0) + expense.amount)
  })

  const totalExpense = Array.from(breakdownMap.values()).reduce((sum, value) => sum + value, 0) || 1
  const expenseBreakdown = Array.from(breakdownMap.entries()).map(([name, value]) => ({
    name,
    value: Math.round((value / totalExpense) * 100),
  }))

  return {
    months: Array.from(monthMap.values()),
    expenseBreakdown,
  }
}

export const buildCrmSummary = async (orgId: string) => {
  const [deals, contacts] = await Promise.all([
    prisma.deal.findMany({ where: { orgId }, include: { company: true } }),
    prisma.contact.findMany({ where: { orgId } }),
  ])

  const pipelineMap = new Map<string, { stage: string; count: number; value: number }>()
  deals.forEach((deal) => {
    const key = deal.stage
    if (!pipelineMap.has(key)) {
      pipelineMap.set(key, { stage: key, count: 0, value: 0 })
    }
    const entry = pipelineMap.get(key)
    if (!entry) return
    entry.count += 1
    entry.value += deal.value
  })

  const contactMap = new Map<string, number>()
  contacts.forEach((contact) => {
    const key = contact.status
    contactMap.set(key, (contactMap.get(key) || 0) + 1)
  })

  const pipeline = Array.from(pipelineMap.values())
  const contactStatus = Array.from(contactMap.entries()).map(([status, count]) => ({ status, count }))
  const topDeals = [...deals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((deal) => ({
      id: deal.id,
      title: deal.title,
      company: deal.company?.name || "",
      value: deal.value,
      stage: deal.stage,
    }))

  return {
    pipeline,
    contactStatus,
    topDeals,
  }
}

export const buildVatSummary = async (orgId: string) => {
  const months = buildMonthRange(6)
  const invoices = await prisma.invoice.findMany({ where: { orgId } })

  const monthMap = new Map(
    months.map((month) => [
      month.key,
      { month: month.label, taxable: 0, vatDue: 0 },
    ]),
  )

  invoices.forEach((invoice) => {
    if (!["PAID", "SENT", "OVERDUE"].includes(invoice.status)) return
    const date = safeDate(invoice.issueDate) || invoice.createdAt
    const key = getMonthKey(date)
    const entry = monthMap.get(key)
    if (!entry) return
    entry.taxable += invoice.amount
    entry.vatDue += Math.round(invoice.amount * VAT_RATE)
  })

  const totalTaxable = Array.from(monthMap.values()).reduce((sum, entry) => sum + entry.taxable, 0)
  const totalVat = Array.from(monthMap.values()).reduce((sum, entry) => sum + entry.vatDue, 0)

  return {
    vatRate: VAT_RATE,
    totalTaxable,
    totalVat,
    months: Array.from(monthMap.values()),
  }
}
