"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Mail, Users, Send, BarChart3, Plus, Eye, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { FEATURE_STATE_COPY } from "@/lib/feature-state"

const campaigns = [
  {
    id: "1",
    name: "Welcome Series",
    subject: "Welcome to Civis CRM!",
    status: "active",
    sent: 1250,
    opened: 387,
    clicked: 89,
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    name: "Product Update",
    subject: "New Features in Civis v2.0",
    status: "draft",
    sent: 0,
    opened: 0,
    clicked: 0,
    createdAt: "2024-01-20"
  },
  {
    id: "3",
    name: "Holiday Promotion",
    subject: "Special Holiday Discount - 30% Off",
    status: "scheduled",
    sent: 0,
    opened: 0,
    clicked: 0,
    createdAt: "2024-01-18"
  }
]

const templates = [
  {
    id: "1",
    name: "Welcome Email",
    category: "Onboarding",
    preview: "Welcome to our platform! We're excited to have you..."
  },
  {
    id: "2",
    name: "Product Update",
    category: "Announcements",
    preview: "We've been working hard on new features..."
  },
  {
    id: "3",
    name: "Newsletter",
    category: "Marketing",
    preview: "Here's what's new this month..."
  }
]

export default function MarketingPage() {
  const [activeTab, setActiveTab] = useState("campaigns")
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [campaignName, setCampaignName] = useState("")
  const [campaignSubject, setCampaignSubject] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const marketingUnavailableCopy =
    "Campaign persistence, send workflows, and performance tracking are not live in this release yet."

  const handleCreateCampaign = () => {
    toast({
      title: "Campaign creation unavailable",
      description: marketingUnavailableCopy,
      variant: "destructive",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Marketing</h1>
          <p className="text-muted-foreground">
            Preview how marketing could fit into Civis without pretending campaign delivery is production-ready.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This workspace currently exposes a preview-only marketing module. Live sending, saved drafts, and reports
            stay unavailable until persistence and provider validation are completed.
          </p>
        </div>
        <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Preview Campaign Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new email marketing campaign.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="Enter campaign name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign-subject">Email Subject</Label>
                <Input
                  id="campaign-subject"
                  placeholder="Enter email subject"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} - {template.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateCampaign} className="w-full">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Preview data only</p>
            <p className="mt-1">
              The campaign cards below are sample layouts to show the intended product direction. They are not live
              records from this workspace, and campaign sending remains disabled for launch.
            </p>
          </div>
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>{campaign.subject}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Sample</Badge>
                      <Badge variant={
                        campaign.status === "active" ? "default" :
                        campaign.status === "scheduled" ? "secondary" : "outline"
                      }>
                        {campaign.status}
                      </Badge>
                      <Button variant="ghost" size="sm" disabled>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sent</p>
                      <p className="font-medium">{campaign.sent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Opened</p>
                      <p className="font-medium">{campaign.opened.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Clicked</p>
                      <p className="font-medium">{campaign.clicked.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{campaign.createdAt}</p>
                    </div>
                  </div>
                  {campaign.sent > 0 && (
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" disabled>
                        <Eye className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Send className="h-4 w-4 mr-2" />
                        Send Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.preview}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Template editing and preview rendering are still disabled in this release.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" disabled>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscriber Lists</CardTitle>
              <CardDescription>
                Manage your email subscriber lists and segments.
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">All Contacts</h3>
                      <p className="text-sm text-muted-foreground">Sample segmentation only in this release.</p>
                    </div>
                  <Button variant="outline" size="sm" disabled>
                    <Users className="h-4 w-4 mr-2" />
                    Preview only
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">Active Customers</h3>
                    <p className="text-sm text-muted-foreground">{FEATURE_STATE_COPY.notAvailableThisRelease}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Users className="h-4 w-4 mr-2" />
                    Preview only
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            Analytics cards remain illustrative until real campaign persistence and provider-backed delivery exist.
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,450</div>
                <p className="text-xs text-muted-foreground">+180 from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Open Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">31.2%</div>
                <p className="text-xs text-muted-foreground">+2.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Click Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">7.1%</div>
                <p className="text-xs text-muted-foreground">+0.8% from last month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
