"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ShieldCheck } from "lucide-react"

type CompliancePackProps = {
  employeesCount: number
  payrollRuns: number
}

const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
  const lines = [headers.join(","), ...rows.map((row) => row.join(","))]
  const blob = new Blob([lines.join("\n")], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

export function CompliancePack({ employeesCount, payrollRuns }: CompliancePackProps) {
  const downloadPayeTemplate = () => {
    downloadCsv(
      "paye-template.csv",
      [
        "Employee Name",
        "Employee ID",
        "Tax ID",
        "Gross Pay (NGN)",
        "Taxable Pay (NGN)",
        "PAYE (NGN)",
        "Period",
      ],
      [["Adaeze Okafor", "EMP-001", "TIN-0001", "250000", "235000", "17625", "2025-02"]],
    )
  }

  const downloadPensionTemplate = () => {
    downloadCsv(
      "pension-template.csv",
      [
        "Employee Name",
        "Pension ID",
        "Employer Contribution (NGN)",
        "Employee Contribution (NGN)",
        "Total (NGN)",
        "Period",
      ],
      [["Ibrahim Musa", "PEN-1001", "25000", "20000", "45000", "2025-02"]],
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Regional Compliance Pack
        </CardTitle>
        <CardDescription>NGN-first payroll templates for PAYE and pension filings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Employees: {employeesCount}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Payroll runs: {payrollRuns}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Default pension split: 10% employer / 8% employee
          </Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="font-medium">PAYE template</p>
            <p className="text-sm text-muted-foreground">Use this to populate statutory PAYE deductions.</p>
            <Button variant="outline" className="bg-transparent w-full" onClick={downloadPayeTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download PAYE CSV
            </Button>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="font-medium">Pension template</p>
            <p className="text-sm text-muted-foreground">Track employer and employee pension contributions.</p>
            <Button variant="outline" className="bg-transparent w-full" onClick={downloadPensionTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Pension CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
