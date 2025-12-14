"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, BookOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const DOCS = [
  {
    id: 1,
    title: "Getting Started with Civis",
    category: "Basics",
    content: `Welcome to Civis's ERP and CRM platform! This guide will help you get up and running quickly.

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
    lastUpdated: "Nov 1, 2025",
  },
  {
    id: 2,
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
    lastUpdated: "Oct 28, 2025",
  },
  {
    id: 3,
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
    lastUpdated: "Oct 25, 2025",
  },
  {
    id: 4,
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
    lastUpdated: "Oct 20, 2025",
  },
  {
    id: 5,
    title: "Project Management",
    category: "Projects",
    content: `Plan, execute, and track projects efficiently using the Projects module.

Deliver projects on time and within budget using Civis's comprehensive project management tools.

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
    lastUpdated: "Oct 18, 2025",
  },
  {
    id: 6,
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
    lastUpdated: "Oct 15, 2025",
  },
  {
    id: 7,
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
    lastUpdated: "Oct 12, 2025",
  },
  {
    id: 8,
    title: "Security & Permissions",
    category: "Security",
    content: `Protect your data with Civis's comprehensive security features.

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
    lastUpdated: "Oct 10, 2025",
  },
  {
    id: 9,
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
    lastUpdated: "Oct 8, 2025",
  },
]

const ITEMS_PER_PAGE = 3

export default function DocsPage() {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(DOCS.length / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const currentDocs = DOCS.slice(startIdx, endIdx)

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documentation</h1>
          <p className="text-muted-foreground">Learn how to use Civis's ERP and CRM platform</p>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid gap-6">
        {currentDocs.map((doc) => (
          <Card key={doc.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <CardTitle className="text-xl">{doc.title}</CardTitle>
                    <CardDescription className="text-xs mt-2">
                      <span className="inline-block px-2 py-1 rounded bg-primary/10 text-primary font-medium">
                        {doc.category}
                      </span>
                      <span className="ml-3 text-muted-foreground">Updated {doc.lastUpdated}</span>
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-line text-sm leading-relaxed line-clamp-6">{doc.content}</p>
              <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                <FileText className="w-4 h-4" />
                Read Full Article
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {startIdx + 1}–{Math.min(endIdx, DOCS.length)} of {DOCS.length} articles
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

          {/* Page Numbers */}
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
    </div>
  )
}
