export type ReportType = "analytics" | "accounting" | "crm" | "vat" | "audit"

export type ReportRow = Record<string, string | number | null | undefined>

const sampleData: Record<ReportType, ReportRow[]> = {
  analytics: [
    { month: "Jan", revenue: 45000, expenses: 32000, customers: 450 },
    { month: "Feb", revenue: 52000, expenses: 35000, customers: 520 },
    { month: "Mar", revenue: 48000, expenses: 33000, customers: 480 },
    { month: "Apr", revenue: 61000, expenses: 38000, customers: 610 },
    { month: "May", revenue: 55000, expenses: 36000, customers: 680 },
    { month: "Jun", revenue: 67000, expenses: 41000, customers: 750 },
  ],
  accounting: [
    { type: "invoice", reference: "INV-001", client: "Acme Corp", amount: 500000, status: "paid" },
    { type: "invoice", reference: "INV-002", client: "Beta Ltd", amount: 320000, status: "pending" },
    { type: "expense", reference: "EXP-019", client: "Cloud Hosting", amount: 210000, status: "approved" },
    { type: "invoice", reference: "INV-004", client: "Delta LLC", amount: 450000, status: "paid" },
  ],
  crm: [
    { type: "deal", title: "Civis Suite - Northwind", stage: "proposal", value: 850000 },
    { type: "deal", title: "ERP License - Globex", stage: "negotiation", value: 640000 },
    { type: "contact", name: "Adaeze Okafor", status: "lead", company: "Acme Corp" },
    { type: "contact", name: "Ibrahim Musa", status: "customer", company: "Nimbus" },
  ],
  vat: [
    { invoice: "INV-2025-001", client: "Acme Corp", amount: 450000, vatRate: "7.5%", vatDue: 33750, status: "paid" },
    { invoice: "INV-2025-014", client: "Globex", amount: 320000, vatRate: "7.5%", vatDue: 24000, status: "sent" },
  ],
  audit: [
    { timestamp: "2025-02-10T10:21:00Z", user: "ikchils@gmail.com", action: "Updated invoice", entity: "Invoice", entityId: "INV-2025-014" },
    { timestamp: "2025-02-11T08:32:00Z", user: "System", action: "Generated follow-up tasks", entity: "Task", entityId: "-" },
  ],
}

export const toCsv = (rows: ReportRow[]) => {
  if (!rows?.length) return ""
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = row[key]
          if (value === undefined || value === null) return ""
          const str = String(value)
          return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
        })
        .join(","),
    ),
  ]
  return lines.join("\n")
}

export const generateCsv = (type: ReportType, rows?: ReportRow[]): string => {
  const data = rows?.length ? rows : sampleData[type]
  return toCsv(data || [])
}
