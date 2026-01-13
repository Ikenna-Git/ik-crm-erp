export type KpiFormat = "number" | "naira" | "percent"

export type KpiDefinition = {
  id: string
  label: string
  description: string
  key: string
  format: KpiFormat
}

export const KPI_CATALOG: KpiDefinition[] = [
  {
    id: "contacts",
    label: "Total Contacts",
    description: "All contacts tracked in CRM",
    key: "contacts",
    format: "number",
  },
  {
    id: "openDeals",
    label: "Open Deals",
    description: "Active deals in the pipeline",
    key: "openDeals",
    format: "number",
  },
  {
    id: "pipelineValue",
    label: "Pipeline Value",
    description: "Value of active deals",
    key: "pipelineValue",
    format: "naira",
  },
  {
    id: "revenueMtd",
    label: "Revenue (MTD)",
    description: "Paid invoices this month",
    key: "revenueMtd",
    format: "naira",
  },
  {
    id: "expensesMtd",
    label: "Expenses (MTD)",
    description: "Expenses logged this month",
    key: "expensesMtd",
    format: "naira",
  },
  {
    id: "overdueInvoices",
    label: "Overdue Invoices",
    description: "Invoices past due date",
    key: "overdueInvoices",
    format: "number",
  },
  {
    id: "pendingExpenses",
    label: "Pending Expenses",
    description: "Expenses awaiting approval",
    key: "pendingExpenses",
    format: "number",
  },
]

const DEFAULT_KPIS: Record<string, string[]> = {
  SUPER_ADMIN: ["revenueMtd", "expensesMtd", "pipelineValue", "overdueInvoices"],
  ADMIN: ["openDeals", "pipelineValue", "overdueInvoices", "pendingExpenses"],
  USER: ["contacts", "openDeals", "pendingExpenses", "overdueInvoices"],
}

export const getDefaultKpis = (role?: string) => {
  const normalized = (role || "USER").toUpperCase()
  return DEFAULT_KPIS[normalized] || DEFAULT_KPIS.USER
}
