"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, Mail, Phone, Users } from "lucide-react"

type EmployeeRecord = {
  name?: string
  email?: string | null
  phone?: string | null
  department?: string | null
  position?: string | null
}

type DuplicateSummary = {
  groups: Array<{ key: string; count: number }>
  duplicateCount: number
}

const buildDuplicateSummary = (values: Array<string | null | undefined>): DuplicateSummary => {
  const map = new Map<string, number>()
  values
    .map((value) => (value || "").trim().toLowerCase())
    .filter(Boolean)
    .forEach((value) => map.set(value, (map.get(value) || 0) + 1))
  const groups = Array.from(map.entries())
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }))
  const duplicateCount = groups.reduce((sum, group) => sum + (group.count - 1), 0)
  return { groups, duplicateCount }
}

export function HrQualityScorecard({ employees }: { employees: EmployeeRecord[] }) {
  const totalEmployees = employees.length
  const contactable = employees.filter((emp) => Boolean(emp.email || emp.phone)).length
  const missingEmail = employees.filter((emp) => !emp.email).length
  const missingPhone = employees.filter((emp) => !emp.phone).length
  const missingDepartment = employees.filter((emp) => !emp.department).length
  const missingPosition = employees.filter((emp) => !emp.position).length

  const emailDuplicates = buildDuplicateSummary(employees.map((emp) => emp.email || ""))
  const phoneDuplicates = buildDuplicateSummary(employees.map((emp) => emp.phone || ""))
  const duplicateCount = emailDuplicates.duplicateCount + phoneDuplicates.duplicateCount

  const suggestions = [
    missingEmail ? { icon: Mail, label: `Add emails for ${missingEmail} employees` } : null,
    missingPhone ? { icon: Phone, label: `Add phone numbers for ${missingPhone} employees` } : null,
    missingDepartment ? { icon: Users, label: `Assign departments for ${missingDepartment} employees` } : null,
    missingPosition ? { icon: AlertTriangle, label: `Assign positions for ${missingPosition} employees` } : null,
    duplicateCount ? { icon: AlertTriangle, label: `Resolve ${duplicateCount} duplicate contact entries` } : null,
  ].filter(Boolean)

  const qualityScore = totalEmployees
    ? Math.max(
        0,
        100 - Math.min(60, Math.round((missingEmail + missingPhone + duplicateCount) / totalEmployees) * 20),
      )
    : 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>HR Data Quality</CardTitle>
        <CardDescription>Validate employee records before payroll and compliance runs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Score {qualityScore}%
          </Badge>
          <Badge variant="outline" className="text-xs">
            Contactable {contactable}/{totalEmployees}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Missing email {missingEmail}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Missing phone {missingPhone}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Duplicates {duplicateCount}
          </Badge>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-2">
          <p className="text-sm font-semibold">Auto-suggested fixes</p>
          {suggestions.length ? (
            <div className="space-y-2">
              {suggestions.slice(0, 5).map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={`${item.label}-${idx}`} className="flex items-center gap-3 text-sm">
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Records are clean and ready for payroll.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
