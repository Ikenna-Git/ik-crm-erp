#!/usr/bin/env node

const fs = require("fs")
const path = require("path")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const CONFIRM_TOKEN = "DELETE_DEMO_DATA"

const argv = process.argv.slice(2)
const readArg = (flag) => {
  const index = argv.indexOf(flag)
  if (index === -1) return undefined
  return argv[index + 1]
}

const hasFlag = (flag) => argv.includes(flag)

const orgId = readArg("--org")
const outPath = readArg("--out")
const destructive = hasFlag("--delete")
const includeSuspected = hasFlag("--include-suspected")
const confirmDelete = readArg("--confirm-delete")

if (!orgId) {
  console.error("Usage: node scripts/fake-data-review.cjs --org <orgId> [--out report.json] [--delete --confirm-delete DELETE_DEMO_DATA] [--include-suspected]")
  process.exit(1)
}

if (destructive && confirmDelete !== CONFIRM_TOKEN) {
  console.error(`Refusing destructive mode. Re-run with --confirm-delete ${CONFIRM_TOKEN}`)
  process.exit(1)
}

const seedPeople = new Set([
  "adaeze okafor",
  "emeka umeh",
  "sarah johnson",
  "david chen",
  "ibrahim musa",
  "lena martins",
  "grace williams",
  "noah brown",
  "john smith",
  "michael chen",
  "emma davis",
  "lisa anderson",
  "finance bot",
  "civis bot",
  "hr ops",
  "it",
  "ops",
  "sales",
  "admin",
])

const seedCompanies = new Set([
  "acme corp",
  "northwind",
  "globex",
  "venture labs",
  "novaworks",
  "blue ridge",
  "blue ridge retail",
  "nimbus",
  "zenith",
  "zenith logistics",
  "northwind procurement",
  "acme holdings",
  "enterprise corp",
  "startup labs",
  "tech solutions inc",
])

const exactPatterns = [
  /^inv-2025-\d{3}$/i,
  /^expense \d+ - /i,
  /^dem-\d{3}$/i,
  /^con-\d{3}$/i,
  /^co-\d{3}$/i,
  /^run-\d+$/i,
]

const normalize = (value) => String(value || "").trim().toLowerCase()

const includesKnownSeed = (value) => {
  const normalized = normalize(value)
  if (!normalized) return false
  return seedPeople.has(normalized) || seedCompanies.has(normalized)
}

const classifyRecord = (model, record, fields) => {
  const reasons = []
  const suspectedReasons = []

  for (const field of fields) {
    const raw = record[field]
    if (typeof raw !== "string" || !raw.trim()) continue
    const value = raw.trim()
    const normalized = value.toLowerCase()

    if (normalized.endsWith("@example.com")) {
      reasons.push(`${field}=example.com email`)
    }

    if (exactPatterns.some((pattern) => pattern.test(value))) {
      reasons.push(`${field}=seed pattern`)
    }

    if (includesKnownSeed(value)) {
      suspectedReasons.push(`${field}=known seed value`)
    }

    if (/^https:\/\/hooks\.civis\.io\//i.test(value)) {
      suspectedReasons.push(`${field}=demo webhook target`)
    }

    if (/^\/(getting-started|crm-|accounting-|inventory-|project-|hr-|analytics-|api-|security-)/i.test(value)) {
      suspectedReasons.push(`${field}=demo asset path`)
    }
  }

  if (model === "Contact" && normalize(record.email).endsWith("@example.com") && includesKnownSeed(record.company)) {
    reasons.push("contact example.com + seed company")
  }

  if (model === "Invoice" && /^INV-2025-\d{3}$/i.test(String(record.invoiceNumber || "")) && includesKnownSeed(record.clientName)) {
    reasons.push("seed invoice number + seed client")
  }

  if (model === "Expense" && /^Expense \d+ - /i.test(String(record.description || ""))) {
    reasons.push("seed expense description")
  }

  const confidence = reasons.length > 0 ? "confirmed" : suspectedReasons.length > 0 ? "suspected" : null
  const combinedReasons = [...reasons, ...suspectedReasons]

  if (!confidence) return null

  return {
    model,
    id: record.id,
    confidence,
    reasons: combinedReasons,
    preview: Object.fromEntries(
      Object.entries(record).filter(([key, value]) => key === "id" || fields.includes(key) || (typeof value === "string" && value.trim())),
    ),
  }
}

const reviewDefinitions = [
  { model: "Company", delegate: "company", fields: ["name", "industry"] },
  { model: "Contact", delegate: "contact", fields: ["name", "email", "phone", "companyName"] },
  { model: "Deal", delegate: "deal", fields: ["title"] },
  { model: "Invoice", delegate: "invoice", fields: ["invoiceNumber", "clientName"] },
  { model: "Expense", delegate: "expense", fields: ["description", "submittedBy", "category"] },
  { model: "Position", delegate: "position", fields: ["title", "department"] },
  { model: "Employee", delegate: "employee", fields: ["name", "email", "department"] },
  { model: "PayrollRecord", delegate: "payrollRecord", fields: ["employeeName", "period"] },
  { model: "AttendanceRecord", delegate: "attendanceRecord", fields: ["employeeName", "status", "note"] },
  { model: "Project", delegate: "project", fields: ["name", "client", "description"] },
  { model: "ProjectTask", delegate: "projectTask", fields: ["title", "assignee"] },
  { model: "InventoryProduct", delegate: "inventoryProduct", fields: ["sku", "name", "supplier"] },
  { model: "InventoryStock", delegate: "inventoryStock", fields: ["sku", "name", "warehouseLocation"] },
  { model: "PurchaseOrder", delegate: "purchaseOrder", fields: ["orderNo", "supplier"] },
  { model: "GalleryItem", delegate: "galleryItem", fields: ["title", "url"] },
  { model: "Doc", delegate: "doc", fields: ["title", "category"] },
  { model: "ClientPortal", delegate: "clientPortal", fields: ["name", "contactName", "contactEmail", "summary"] },
]

const buildDeletePlan = (reportItems) => {
  const idsByModel = reportItems.reduce((acc, item) => {
    acc[item.model] ??= []
    acc[item.model].push(item.id)
    return acc
  }, {})

  const allEntityIds = Object.values(idsByModel).flat()

  const dealIds = idsByModel.Deal || []
  const contactIds = idsByModel.Contact || []
  const projectIds = idsByModel.Project || []

  return [
    () => prisma.task.deleteMany({ where: { OR: [
      dealIds.length ? { dealId: { in: dealIds } } : undefined,
      contactIds.length ? { relatedType: "contact", relatedId: { in: contactIds } } : undefined,
      dealIds.length ? { relatedType: "deal", relatedId: { in: dealIds } } : undefined,
      projectIds.length ? { relatedType: "project", relatedId: { in: projectIds } } : undefined,
    ].filter(Boolean) } }),
    () => prisma.decisionTrail.deleteMany({ where: { entityId: { in: allEntityIds } } }),
    () => prisma.auditLog.deleteMany({ where: { entityId: { in: allEntityIds } } }),
    () => prisma.projectTask.deleteMany({ where: { id: { in: idsByModel.ProjectTask || [] } } }),
    () => prisma.payrollRecord.deleteMany({ where: { id: { in: idsByModel.PayrollRecord || [] } } }),
    () => prisma.attendanceRecord.deleteMany({ where: { id: { in: idsByModel.AttendanceRecord || [] } } }),
    () => prisma.deal.deleteMany({ where: { id: { in: idsByModel.Deal || [] } } }),
    () => prisma.invoice.deleteMany({ where: { id: { in: idsByModel.Invoice || [] } } }),
    () => prisma.expense.deleteMany({ where: { id: { in: idsByModel.Expense || [] } } }),
    () => prisma.project.deleteMany({ where: { id: { in: idsByModel.Project || [] } } }),
    () => prisma.inventoryStock.deleteMany({ where: { id: { in: idsByModel.InventoryStock || [] } } }),
    () => prisma.inventoryProduct.deleteMany({ where: { id: { in: idsByModel.InventoryProduct || [] } } }),
    () => prisma.purchaseOrder.deleteMany({ where: { id: { in: idsByModel.PurchaseOrder || [] } } }),
    () => prisma.galleryItem.deleteMany({ where: { id: { in: idsByModel.GalleryItem || [] } } }),
    () => prisma.doc.deleteMany({ where: { id: { in: idsByModel.Doc || [] } } }),
    () => prisma.clientPortal.deleteMany({ where: { id: { in: idsByModel.ClientPortal || [] } } }),
    () => prisma.contact.deleteMany({ where: { id: { in: idsByModel.Contact || [] } } }),
    () => prisma.company.deleteMany({ where: { id: { in: idsByModel.Company || [] } } }),
    () => prisma.employee.deleteMany({ where: { id: { in: idsByModel.Employee || [] } } }),
    () => prisma.position.deleteMany({ where: { id: { in: idsByModel.Position || [] } } }),
  ]
}

const run = async () => {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, status: true },
  })

  if (!org) {
    throw new Error(`Organization not found: ${orgId}`)
  }

  const findings = []

  for (const definition of reviewDefinitions) {
    const records = await prisma[definition.delegate].findMany({
      where: { orgId: org.id },
      select: Object.fromEntries(["id", ...definition.fields].map((field) => [field, true])),
    })

    for (const record of records) {
      const finding = classifyRecord(definition.model, record, definition.fields)
      if (finding) {
        findings.push(finding)
      }
    }
  }

  const confirmed = findings.filter((item) => item.confidence === "confirmed")
  const suspected = findings.filter((item) => item.confidence === "suspected")

  const report = {
    generatedAt: new Date().toISOString(),
    org,
    dryRun: !destructive,
    destructive,
    includeSuspected,
    summary: {
      confirmedCount: confirmed.length,
      suspectedCount: suspected.length,
    },
    confirmed,
    suspected,
  }

  if (outPath) {
    const target = path.resolve(process.cwd(), outPath)
    fs.mkdirSync(path.dirname(target), { recursive: true })
    fs.writeFileSync(target, JSON.stringify(report, null, 2))
  }

  console.log(JSON.stringify(report.summary, null, 2))
  confirmed.forEach((item) => {
    console.log(`[CONFIRMED] ${item.model} ${item.id} :: ${item.reasons.join(", ")}`)
  })
  suspected.forEach((item) => {
    console.log(`[SUSPECTED] ${item.model} ${item.id} :: ${item.reasons.join(", ")}`)
  })

  if (!destructive) {
    console.log("Dry run only. No records were deleted.")
    return
  }

  const deletionCandidates = includeSuspected ? findings : confirmed
  if (!deletionCandidates.length) {
    console.log("No deletion candidates matched the requested safety threshold.")
    return
  }

  console.log(`Deleting ${deletionCandidates.length} candidate records for org ${org.name} (${org.id})`)
  for (const step of buildDeletePlan(deletionCandidates)) {
    await step()
  }
  console.log("Deletion plan executed.")
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
