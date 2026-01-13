"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen, FileText, MoreHorizontal, Plus, X, Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getSessionHeaders } from "@/lib/user-settings"

type DocItem = {
  id: string
  title: string
  category?: string
  content: string
  mediaUrl?: string
  updatedAt: string
}

const DOCS_SEED: DocItem[] = [
  {
    id: "doc-1",
    title: "Getting Started with Civis",
    category: "Basics",
    content: `Welcome to Civis' ERP and CRM platform! This guide will help you get up and running quickly.

Civis is a comprehensive business management solution designed to streamline your operations across multiple departments. Whether you're managing customer relationships, accounting, inventory, or projects, Civis provides the tools you need.

Key Features:
- Unified dashboard for all business operations
- Real-time analytics and reporting
- Seamless integration across all modules
- Mobile-responsive design
- Secure cloud-based storage

Getting Started:
1. Create your account with your business email
2. Set up your company profile
3. Invite team members
4. Configure your preferred modules
5. Start managing your business!`,
    updatedAt: new Date("2025-11-01").toISOString(),
  },
  {
    id: "doc-2",
    title: "CRM Module Guide",
    category: "CRM",
    content: `Master the Customer Relationship Management module to build stronger customer relationships.

The CRM module is your central hub for managing all customer interactions. Track leads, manage deals, and monitor sales activities all in one place.

Main Features:
- Contact Management: Store and organize all customer information
- Sales Pipeline: Track deals through different stages
- Activity Tracking: Log calls, emails, and meetings
- Analytics: Understand your sales performance

Best Practices:
- Update contact information regularly
- Log all customer interactions
- Use custom fields for your unique data
- Set up automated follow-ups
- Review pipeline reports weekly

Tips & Tricks:
- Use filters to segment your contacts
- Create templates for common activities
- Set up alerts for high-value deals
- Integrate with email for seamless communication`,
    updatedAt: new Date("2025-10-28").toISOString(),
  },
  {
    id: "doc-3",
    title: "Accounting & Finance",
    category: "Accounting",
    content: `Learn how to manage your finances with the Accounting module.

The Accounting module provides complete financial management capabilities for your business.

Key Sections:
- Invoicing: Create, send, and track invoices
- Expense Tracking: Monitor all business expenses
- Financial Reports: Generate insights from your data
- Reconciliation: Match transactions and accounts

Workflows:
1. Create invoices for services or products
2. Track expenses by category
3. Monitor payment status
4. Generate monthly financial reports
5. Archive records for compliance

Advanced Features:
- Multi-currency support
- Tax calculations
- Budget forecasting
- Custom report generation
- Audit trail logging

Security:
All financial data is encrypted and backed up regularly. Access is controlled through role-based permissions.`,
    updatedAt: new Date("2025-10-25").toISOString(),
  },
  {
    id: "doc-4",
    title: "Inventory Management",
    category: "Inventory",
    content: `Optimize your inventory with smart stock tracking and management.

The Inventory module helps you maintain optimal stock levels and streamline procurement.

Core Features:
- Product Catalog: Manage SKUs and pricing
- Stock Levels: Real-time inventory tracking
- Purchase Orders: Automate reordering
- Alerts: Get notified of low stock

Inventory Workflow:
1. Add products to your catalog
2. Set minimum stock levels
3. Monitor stock levels daily
4. Create purchase orders automatically
5. Receive and update stock

Best Practices:
- Use consistent SKU naming conventions
- Conduct regular physical audits
- Set realistic reorder points
- Maintain supplier relationships
- Archive obsolete items

Reports Available:
- Stock valuation report
- Inventory turnover analysis
- Supplier performance report
- Expiration tracking`,
    updatedAt: new Date("2025-10-20").toISOString(),
  },
  {
    id: "doc-5",
    title: "Project Management",
    category: "Projects",
    content: `Plan, execute, and track projects efficiently using the Projects module.

Deliver projects on time and within budget using Civis' comprehensive project management tools.

Project Planning:
- Define project scope and objectives
- Create detailed timelines
- Allocate resources and budgets
- Identify key milestones
- Set up dependencies

Task Management:
- Break projects into manageable tasks
- Assign tasks to team members
- Set priorities and deadlines
- Track progress in real-time
- Manage dependencies

Tracking & Reporting:
- Monitor budget utilization
- Track time spent on tasks
- Generate progress reports
- Identify risks and issues
- Forecast project completion

Team Collaboration:
- Assign task ownership
- Share project updates
- Comment on tasks
- Attach documents
- Notify stakeholders`,
    updatedAt: new Date("2025-10-18").toISOString(),
  },
  {
    id: "doc-6",
    title: "HR & Employee Management",
    category: "HR",
    content: `Manage your workforce effectively with the HR module.

The HR module provides comprehensive employee and payroll management capabilities.

Employee Management:
- Maintain employee records
- Track employment status
- Manage department assignments
- Monitor certifications and training
- Handle file attachments

Payroll Processing:
- Calculate salaries and bonuses
- Manage deductions
- Generate payslips
- Track tax withholdings
- Maintain compliance records

Attendance Tracking:
- Daily check-in/check-out
- Track working hours
- Monitor attendance patterns
- Generate attendance reports
- Manage leave requests

Compliance & Documentation:
- Store required documents
- Track certifications
- Maintain audit trails
- Generate compliance reports
- Archive historical records

Reports:
- Payroll summary reports
- Attendance reports
- Headcount reports
- Cost allocation reports`,
    updatedAt: new Date("2025-10-15").toISOString(),
  },
  {
    id: "doc-7",
    title: "Analytics & Reporting",
    category: "Analytics",
    content: `Gain insights into your business operations with comprehensive analytics.

The Analytics module provides real-time dashboards and detailed reports.

Key Metrics:
- Revenue and sales trends
- Customer acquisition cost
- Employee productivity
- Project profitability
- Inventory efficiency

Dashboard Features:
- Customizable widgets
- Real-time data updates
- Drill-down capabilities
- Export functionality
- Scheduled reports

Report Types:
- Sales performance reports
- Financial summaries
- Inventory analytics
- HR metrics
- Project performance

Creating Custom Reports:
1. Select data source
2. Choose metrics
3. Add filters
4. Set visualization type
5. Schedule delivery

Best Practices:
- Review dashboards daily
- Set up alerts for anomalies
- Compare period-over-period
- Share reports with stakeholders
- Archive historical reports`,
    updatedAt: new Date("2025-10-12").toISOString(),
  },
  {
    id: "doc-8",
    title: "Security & Permissions",
    category: "Security",
    content: `Protect your data with Civis' comprehensive security features.

Security is paramount in Civis. We implement industry-leading practices to protect your business data.

Access Control:
- Role-based permissions
- User authentication
- Session management
- Activity logging
- IP whitelisting

Data Protection:
- Encryption at rest and in transit
- Regular backups
- Disaster recovery plans
- GDPR compliance
- SOC 2 certification

User Management:
- Create user accounts
- Assign roles and permissions
- Manage access levels
- Monitor login activity
- Revoke access immediately

Best Practices:
- Use strong passwords
- Enable two-factor authentication
- Review permissions regularly
- Audit access logs
- Update security policies

Compliance:
- Data residency options
- Audit trails
- Retention policies
- Export capabilities
- Legal holds`,
    updatedAt: new Date("2025-10-10").toISOString(),
  },
  {
    id: "doc-9",
    title: "Integration & API",
    category: "Advanced",
    content: `Extend Civis with integrations and API access.

Connect Civis with your other business tools for seamless data flow.

Popular Integrations:
- Email platforms (Gmail, Outlook)
- Communication tools (Slack, Teams)
- Cloud storage (Google Drive, OneDrive)
- Payment processors (Stripe, PayPal)
- Accounting software

API Features:
- RESTful API endpoints
- Webhook support
- Rate limiting
- API documentation
- SDK libraries

Getting Started with API:
1. Generate API credentials
2. Review API documentation
3. Test in sandbox environment
4. Deploy to production
5. Monitor usage

Common Use Cases:
- Sync data with external systems
- Automate workflows
- Build custom applications
- Create real-time dashboards
- Integrate third-party services

Support:
- API documentation
- Developer sandbox
- Code samples
- Technical support
- Community forum`,
    updatedAt: new Date("2025-10-08").toISOString(),
  },
]

const ITEMS_PER_PAGE = 3

const formatDocDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })

export default function DocsPage() {
  const [docs, setDocs] = useState<DocItem[]>(DOCS_SEED)
  const [currentPage, setCurrentPage] = useState(1)
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showViewer, setShowViewer] = useState(false)
  const [activeDoc, setActiveDoc] = useState<DocItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [apiError, setApiError] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [form, setForm] = useState({
    title: "",
    category: "",
    content: "",
    mediaUrl: "",
  })

  const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("")
      return
    }
    const preview = URL.createObjectURL(selectedFile)
    setPreviewUrl(preview)
    return () => URL.revokeObjectURL(preview)
  }, [selectedFile])

  const parseJsonSafe = async (res: Response) => {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`)
    }
  }

  const mapDoc = (doc: any): DocItem => ({
    id: doc.id,
    title: doc.title,
    category: doc.category || "General",
    content: doc.content || "",
    mediaUrl: doc.mediaUrl || "",
    updatedAt: doc.updatedAt || doc.createdAt || new Date().toISOString(),
  })

  const loadDocs = async () => {
    setLoading(true)
    setApiError("")
    try {
      const res = await fetch("/api/docs", {
        headers: { ...getSessionHeaders() },
      })
      if (res.status === 503) {
        setApiError("Database not configured — showing demo docs.")
        setDocs(DOCS_SEED)
        return
      }
      const data = await parseJsonSafe(res)
      if (!res.ok) throw new Error(data?.error || "Failed to load docs")
      const items = Array.isArray(data.docs) ? data.docs.map(mapDoc) : []
      setDocs(items.length ? items : DOCS_SEED)
    } catch (err: any) {
      console.error("Failed to load docs", err)
      setApiError(err?.message || "Failed to load docs")
      setDocs(DOCS_SEED)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocs()
  }, [])

  const totalPages = Math.max(1, Math.ceil(docs.length / ITEMS_PER_PAGE))
  const currentDocs = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
    const endIdx = startIdx + ITEMS_PER_PAGE
    return docs.slice(startIdx, endIdx)
  }, [docs, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages))
    }
  }, [currentPage, totalPages])

  const handlePrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))

  const openEditor = (doc?: DocItem) => {
    if (doc) {
      setEditingId(doc.id)
      setForm({
        title: doc.title,
        category: doc.category || "",
        content: doc.content,
        mediaUrl: doc.mediaUrl || "",
      })
    } else {
      setEditingId(null)
      setForm({ title: "", category: "", content: "", mediaUrl: "" })
    }
    setSelectedFile(null)
    setPreviewUrl("")
    setUploadError("")
    setShowEditor(true)
  }

  const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    const res = await fetch("/api/uploads/cloudinary", {
      method: "POST",
      headers: { ...getSessionHeaders() },
      body: formData,
    })
    const data = await parseJsonSafe(res)
    if (!res.ok) throw new Error(data?.error || "Upload failed")
    return data as { url: string }
  }

  const submitDoc = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    setUploadError("")
    try {
      let mediaUrl = form.mediaUrl.trim()
      if (selectedFile) {
        const uploaded = await uploadToCloudinary(selectedFile, "civis/docs")
        mediaUrl = uploaded.url
      }

      if (editingId) {
        const res = await fetch("/api/docs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({
            id: editingId,
            title: form.title.trim(),
            category: form.category.trim() || "General",
            content: form.content,
            mediaUrl,
          }),
        })
        const data = await parseJsonSafe(res)
        if (!res.ok) throw new Error(data?.error || "Failed to update doc")
        const updated = mapDoc(data.doc)
        setDocs((prev) => prev.map((d) => (d.id === editingId ? updated : d)))
      } else {
        const res = await fetch("/api/docs", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getSessionHeaders() },
          body: JSON.stringify({
            title: form.title.trim() || "Untitled",
            category: form.category.trim() || "General",
            content: form.content,
            mediaUrl,
          }),
        })
        const data = await parseJsonSafe(res)
        if (!res.ok) throw new Error(data?.error || "Failed to create doc")
        const created = mapDoc(data.doc)
        setDocs((prev) => [created, ...prev])
        setCurrentPage(1)
      }

      setShowEditor(false)
      setEditingId(null)
      setSelectedFile(null)
      setPreviewUrl("")
      setForm({ title: "", category: "", content: "", mediaUrl: "" })
    } catch (err: any) {
      console.warn("Failed to save doc", err)
      setUploadError(err?.message || "Failed to save doc")
    } finally {
      setSaving(false)
    }
  }

  const deleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/docs?id=${id}`, {
        method: "DELETE",
        headers: { ...getSessionHeaders() },
      })
      if (!res.ok) {
        const data = await parseJsonSafe(res)
        throw new Error(data?.error || "Failed to delete doc")
      }
      setDocs((prev) => prev.filter((doc) => doc.id !== id))
    } catch (err) {
      console.warn("Failed to delete doc", err)
      setDocs((prev) => prev.filter((doc) => doc.id !== id))
    }
  }

  const viewDoc = (doc: DocItem) => {
    setActiveDoc(doc)
    setShowViewer(true)
  }

  const handleFileUpload = (file?: File | null) => {
    if (!file) return
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("File too large. Please upload a file under 5 MB.")
      return
    }
    setSelectedFile(file)
    setUploadError("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
            <p className="text-muted-foreground">Learn, update, and share Civis guides, media, and newsletters.</p>
            {apiError ? <p className="text-xs text-muted-foreground mt-2">{apiError}</p> : null}
          </div>
        </div>
        <Button onClick={() => openEditor()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Document
        </Button>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <Card>
            <CardContent className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading documentation...
            </CardContent>
          </Card>
        ) : (
          currentDocs.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <CardTitle className="text-xl">{doc.title}</CardTitle>
                      <CardDescription className="text-xs mt-2">
                        <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                          {doc.category || "General"}
                        </span>
                        <span className="ml-3 text-muted-foreground">Updated {formatDocDate(doc.updatedAt)}</span>
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => viewDoc(doc)}>Read full</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditor(doc)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-line text-sm leading-relaxed line-clamp-6">{doc.content}</p>
                <div className="flex items-center gap-2 mt-4">
                  <Button variant="outline" className="gap-2 bg-transparent" onClick={() => viewDoc(doc)}>
                    <FileText className="w-4 h-4" />
                    Read Full
                  </Button>
                  {doc.mediaUrl ? (
                    <a
                      href={doc.mediaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open media
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {docs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
          {Math.min(currentPage * ITEMS_PER_PAGE, docs.length)} of {docs.length} articles
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="gap-1 bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="gap-1 bg-transparent"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle>{editingId ? "Edit Document" : "Add Document"}</CardTitle>
                <CardDescription>Add articles, updates, media links, or newsletters.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  rows={8}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write or paste your update, newsletter, or article..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Media URL (image/video/doc link)</label>
                <Input
                  value={form.mediaUrl}
                  onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Media</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*,video/*,application/pdf"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                  <Upload className="w-4 h-4 text-muted-foreground" />
                </div>
                {uploadError ? <p className="text-xs text-destructive">{uploadError}</p> : null}
                {previewUrl ? (
                  <p className="text-xs text-muted-foreground">Selected: {selectedFile?.name}</p>
                ) : null}
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowEditor(false)}>
                  Cancel
                </Button>
                <Button onClick={submitDoc} disabled={saving}>
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </span>
                  ) : editingId ? (
                    "Save changes"
                  ) : (
                    "Add document"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showViewer && activeDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4">
            <CardHeader className="flex flex-row items-start justify-between pb-3">
              <div>
                <CardTitle>{activeDoc.title}</CardTitle>
                <CardDescription>
                  {activeDoc.category || "General"} • Updated {formatDocDate(activeDoc.updatedAt)}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowViewer(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line leading-relaxed">{activeDoc.content}</p>
              {activeDoc.mediaUrl ? (
                <a
                  href={activeDoc.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Open attached media
                </a>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
