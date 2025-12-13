"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar } from "lucide-react"
import { formatNaira } from "@/lib/currency"

interface Deal {
  id: string
  name: string
  company: string
  value: number
  stage: "qualification" | "proposal" | "negotiation" | "closed-won"
  owner: string
  closeDate: string
}

const stages = [
  { id: "qualification", title: "Qualification", color: "bg-blue-50" },
  { id: "proposal", title: "Proposal", color: "bg-yellow-50" },
  { id: "negotiation", title: "Negotiation", color: "bg-purple-50" },
  { id: "closed-won", title: "Closed Won", color: "bg-green-50" },
]

const mockDeals: Deal[] = [
  {
    id: "1",
    name: "Enterprise License",
    company: "Tech Solutions Inc",
    value: 150000,
    stage: "proposal",
    owner: "John Smith",
    closeDate: "2025-12-15",
  },
  {
    id: "2",
    name: "Service Agreement",
    company: "StartUp Labs",
    value: 75000,
    stage: "negotiation",
    owner: "Jane Doe",
    closeDate: "2025-11-30",
  },
  {
    id: "3",
    name: "Implementation",
    company: "Enterprise Corp",
    value: 250000,
    stage: "qualification",
    owner: "John Smith",
    closeDate: "2025-12-31",
  },
  {
    id: "4",
    name: "Renewal",
    company: "Global Industries",
    value: 125000,
    stage: "closed-won",
    owner: "Jane Doe",
    closeDate: "2025-10-15",
  },
]

export function DealsBoard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const stageDeals = mockDeals.filter((d) => d.stage === stage.id)
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0)

          return (
            <div key={stage.id} className={`${stage.color} rounded-lg p-4 min-h-96`}>
              <div className="mb-4">
                <h3 className="font-semibold text-sm mb-1">{stage.title}</h3>
                <p className="text-xs text-muted-foreground">{formatNaira(stageTotal, true)}</p>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white rounded-lg p-3 border border-border hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <p className="font-medium text-sm line-clamp-2">{deal.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{deal.company}</p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{formatNaira(deal.value, true)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {deal.closeDate}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Summary</CardTitle>
          <CardDescription>Total value and deal count by stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stages.map((stage) => {
              const stageDeals = mockDeals.filter((d) => d.stage === stage.id)
              const stageTotal = stageDeals.reduce((sum, d) => sum + d.value, 0)
              return (
                <div key={stage.id} className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">{stage.title}</p>
                  <p className="text-2xl font-bold">{formatNaira(stageTotal, true)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stageDeals.length} deals</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
