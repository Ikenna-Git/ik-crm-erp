"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle2, Merge, Phone, Users } from "lucide-react"

type ContactRecord = {
  name?: string
  email?: string | null
  phone?: string | null
  company?: string | null
  lastContactAt?: string | null
}

type DealRecord = {
  title?: string
  owner?: string | null
  expectedClose?: string | null
  value?: number | null
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

export function CrmQualityScorecard({
  contacts,
  deals,
}: {
  contacts: ContactRecord[]
  deals: DealRecord[]
}) {
  const totalContacts = contacts.length
  const contactable = contacts.filter((contact) => Boolean(contact.email || contact.phone)).length
  const missingPhone = contacts.filter((contact) => !contact.phone).length
  const missingCompany = contacts.filter((contact) => !contact.company).length
  const missingLastContact = contacts.filter((contact) => !contact.lastContactAt).length

  const emailDuplicates = buildDuplicateSummary(contacts.map((contact) => contact.email || ""))
  const phoneDuplicates = buildDuplicateSummary(contacts.map((contact) => contact.phone || ""))
  const duplicateCount = emailDuplicates.duplicateCount + phoneDuplicates.duplicateCount

  const missingDealOwner = deals.filter((deal) => !deal.owner).length
  const missingDealClose = deals.filter((deal) => !deal.expectedClose).length
  const lowValueDeals = deals.filter((deal) => (deal.value || 0) <= 0).length

  const suggestions = [
    missingPhone
      ? { icon: Phone, label: `Add phone numbers for ${missingPhone} contacts` }
      : null,
    missingCompany
      ? { icon: Users, label: `Link ${missingCompany} contacts to a company` }
      : null,
    duplicateCount
      ? { icon: Merge, label: `Merge ${duplicateCount} duplicate contact records` }
      : null,
    missingLastContact
      ? { icon: AlertTriangle, label: `Log last contact dates for ${missingLastContact} records` }
      : null,
    missingDealOwner
      ? { icon: AlertTriangle, label: `Assign owners for ${missingDealOwner} deals` }
      : null,
    missingDealClose
      ? { icon: AlertTriangle, label: `Set close dates for ${missingDealClose} deals` }
      : null,
    lowValueDeals
      ? { icon: AlertTriangle, label: `Update values for ${lowValueDeals} zero-value deals` }
      : null,
  ].filter(Boolean)

  const qualityScore = totalContacts
    ? Math.max(0, 100 - Math.min(60, Math.round((missingPhone + missingCompany + duplicateCount) / totalContacts) * 20))
    : 100

  return (
    <Card>
      <CardHeader>
        <CardTitle>CRM Data Quality</CardTitle>
        <CardDescription>Incomplete, duplicate, and contactable records at a glance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Score {qualityScore}%
          </Badge>
          <Badge variant="outline" className="text-xs">
            Contactable {contactable}/{totalContacts}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Missing phone {missingPhone}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Missing company {missingCompany}
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
              <span>Everything looks clean. Nice work!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
