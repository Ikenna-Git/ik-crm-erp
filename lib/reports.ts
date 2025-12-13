type ReportType = "analytics" | "accounting"

const sampleData: Record<ReportType, Array<Record<string, string | number>>> = {
  analytics: [
    { month: "Jan", revenue: 45000, expenses: 32000, customers: 450 },
    { month: "Feb", revenue: 52000, expenses: 35000, customers: 520 },
    { month: "Mar", revenue: 48000, expenses: 33000, customers: 480 },
    { month: "Apr", revenue: 61000, expenses: 38000, customers: 610 },
    { month: "May", revenue: 55000, expenses: 36000, customers: 680 },
    { month: "Jun", revenue: 67000, expenses: 41000, customers: 750 },
  ],
  accounting: [
    { invoice: "INV-001", client: "Acme Corp", amount: 500000, status: "paid" },
    { invoice: "INV-002", client: "Beta Ltd", amount: 320000, status: "pending" },
    { invoice: "INV-003", client: "Gamma Inc", amount: 210000, status: "overdue" },
    { invoice: "INV-004", client: "Delta LLC", amount: 450000, status: "paid" },
  ],
}

export function generateCsv(type: ReportType): string {
  const rows = sampleData[type]
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
