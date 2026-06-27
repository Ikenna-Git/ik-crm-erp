"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PaginationControls } from "@/components/shared/pagination-controls"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RecordDetailsDialog } from "@/components/shared/record-details-dialog"
import { Calendar, Edit, Eye, ExternalLink, Flag, MoreHorizontal, Trash2, Users, X } from "lucide-react"

type ProjectLink = { label?: string; url: string; category?: string; note?: string }
type LinkedRecord = { id?: string; label?: string }
type ProjectRelations = {
  company?: LinkedRecord | null
  contact?: LinkedRecord | null
  deal?: LinkedRecord | null
}

export interface Project {
  id: string
  name: string
  description: string
  client?: string
  ownerName?: string
  siteName?: string
  location?: string
  linkedRecords?: ProjectRelations
  proofLinks?: ProjectLink[]
  externalLinks?: ProjectLink[]
  status: "planning" | "in-progress" | "on-hold" | "completed"
  progress: number
  team: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  priority: "low" | "medium" | "high"
}

type RelationOption = { id: string; label: string }
type ProjectLinkForm = { label: string; url: string; category: string; note: string }

const statusColors = {
  planning: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  "in-progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-200",
  "on-hold": "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200",
}

const priorityColors = {
  low: "text-blue-600 dark:text-blue-300",
  medium: "text-yellow-600 dark:text-yellow-300",
  high: "text-red-600 dark:text-red-300",
}

const projectNames = [
  "Website Redesign",
  "Mobile App Development",
  "Data Migration",
  "Marketing Campaign",
  "Customer Portal",
  "ERP Upgrade",
  "Support Revamp",
  "Analytics Refresh",
]

const projectClients = ["Acme Corp", "Product Team", "IT Operations", "Marketing", "Northwind", "Globex", "Nimbus"]
const projectStatuses: Project["status"][] = ["planning", "in-progress", "on-hold", "completed"]
const projectPriorities: Project["priority"][] = ["low", "medium", "high"]
const proofCategories = ["Proof", "Screenshot", "Client site", "Deployment", "Demo", "Document"]
const externalCategories = ["GitHub", "Docs", "Deployment", "Monitoring", "Ticket", "Figma", "Portal", "General"]

const buildMockProjects = (count: number): Project[] =>
  Array.from({ length: count }, (_, idx) => {
    const status = projectStatuses[idx % projectStatuses.length]
    const progress = status === "completed" ? 100 : 15 + (idx % 6) * 12
    const budget = 15000 + (idx % 10) * 5000
    const spent = Math.round(budget * (progress / 120))
    const startDate = new Date(2025, idx % 6, (idx % 27) + 1).toISOString().slice(0, 10)
    const endDate = new Date(2025, (idx % 6) + 1, (idx % 27) + 10).toISOString().slice(0, 10)
    return {
      id: `PRJ-${(idx + 1).toString().padStart(3, "0")}`,
      name: projectNames[idx % projectNames.length],
      description: "Project initiative to improve core workflows and delivery.",
      client: projectClients[idx % projectClients.length],
      status,
      progress,
      team: 3 + (idx % 6),
      budget,
      spent,
      startDate,
      endDate,
      priority: projectPriorities[idx % projectPriorities.length],
    }
  })

export const mockProjects: Project[] = buildMockProjects(70)

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount * 805)

const isSafeHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const buildLinkForm = (link?: ProjectLink): ProjectLinkForm => ({
  label: link?.label || "",
  url: link?.url || "",
  category: link?.category || "",
  note: link?.note || "",
})

const normalizeLinks = (links: ProjectLinkForm[], label: string) => {
  const trimmed = links
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
      category: item.category.trim(),
      note: item.note.trim(),
    }))
    .filter((item) => item.label || item.url || item.note)

  const invalid = trimmed.find((item) => item.url && !isSafeHttpUrl(item.url))
  if (invalid) {
    throw new Error(`${label} must use a valid http or https URL.`)
  }

  return trimmed
    .filter((item) => item.url)
    .map((item) => ({
      label: item.label || undefined,
      url: item.url,
      category: item.category || undefined,
      note: item.note || undefined,
    }))
}

const emptyForm = {
  name: "",
  description: "",
  client: "",
  ownerName: "",
  siteName: "",
  location: "",
  linkedCompanyId: "__none__",
  linkedContactId: "__none__",
  linkedDealId: "__none__",
  status: "planning" as Project["status"],
  priority: "medium" as Project["priority"],
  progress: "",
  team: "",
  budget: "",
  spent: "",
  startDate: "",
  endDate: "",
  proofLinks: [buildLinkForm()],
  externalLinks: [buildLinkForm()],
}

type ProjectsBoardProps = {
  searchQuery: string
  statusFilter?: "all" | Project["status"]
  projects?: Project[]
  crmCompanies?: RelationOption[]
  crmContacts?: RelationOption[]
  crmDeals?: RelationOption[]
  uploadsEnabled?: boolean
  onAddProject?: (data: Omit<Project, "id">) => void
  onUpdateProject?: (id: string, data: Omit<Project, "id">) => void
  onDeleteProject?: (id: string) => void
}

export function ProjectsBoard({
  searchQuery,
  statusFilter = "all",
  projects: providedProjects,
  crmCompanies = [],
  crmContacts = [],
  crmDeals = [],
  uploadsEnabled = false,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectsBoardProps) {
  const [projects, setProjects] = useState<Project[]>(providedProjects ?? [])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [editorError, setEditorError] = useState("")
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setProjects(providedProjects ?? [])
  }, [providedProjects])

  const relationMaps = useMemo(
    () => ({
      companies: new Map(crmCompanies.map((item) => [item.id, item.label])),
      contacts: new Map(crmContacts.map((item) => [item.id, item.label])),
      deals: new Map(crmDeals.map((item) => [item.id, item.label])),
    }),
    [crmCompanies, crmContacts, crmDeals],
  )

  const filteredProjects = projects.filter((project) => {
    const query = searchQuery.toLowerCase()
    const relationLabels = [
      project.linkedRecords?.company?.label,
      project.linkedRecords?.contact?.label,
      project.linkedRecords?.deal?.label,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    const matchesQuery =
      project.name.toLowerCase().includes(query) ||
      (project.client || "").toLowerCase().includes(query) ||
      relationLabels.includes(query)
    const matchesStatus = statusFilter === "all" ? true : project.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize))
  const pagedProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, pageSize])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const openEditor = (project?: Project) => {
    setEditorError("")
    if (!project) {
      setEditingId(null)
      setForm(emptyForm)
      setShowModal(true)
      return
    }

    setEditingId(project.id)
    setForm({
      name: project.name,
      description: project.description,
      client: project.client || "",
      ownerName: project.ownerName || "",
      siteName: project.siteName || "",
      location: project.location || "",
      linkedCompanyId: project.linkedRecords?.company?.id || "__none__",
      linkedContactId: project.linkedRecords?.contact?.id || "__none__",
      linkedDealId: project.linkedRecords?.deal?.id || "__none__",
      status: project.status,
      priority: project.priority,
      progress: String(project.progress),
      team: String(project.team),
      budget: String(project.budget),
      spent: String(project.spent),
      startDate: project.startDate,
      endDate: project.endDate,
      proofLinks: project.proofLinks?.length ? project.proofLinks.map(buildLinkForm) : [buildLinkForm()],
      externalLinks: project.externalLinks?.length ? project.externalLinks.map(buildLinkForm) : [buildLinkForm()],
    })
    setShowModal(true)
  }

  const updateLinkRow = (
    group: "proofLinks" | "externalLinks",
    index: number,
    field: keyof ProjectLinkForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  const addLinkRow = (group: "proofLinks" | "externalLinks") => {
    setForm((current) => ({
      ...current,
      [group]: [...current[group], buildLinkForm()],
    }))
  }

  const removeLinkRow = (group: "proofLinks" | "externalLinks", index: number) => {
    setForm((current) => ({
      ...current,
      [group]: current[group].filter((_, itemIndex) => itemIndex !== index).length
        ? current[group].filter((_, itemIndex) => itemIndex !== index)
        : [buildLinkForm()],
    }))
  }

  const buildRelation = (kind: "company" | "contact" | "deal", id: string) => {
    if (!id || id === "__none__") return null
    const label =
      kind === "company"
        ? relationMaps.companies.get(id)
        : kind === "contact"
          ? relationMaps.contacts.get(id)
          : relationMaps.deals.get(id)
    return { id, label: label || id }
  }

  const saveProject = () => {
    setEditorError("")
    try {
      const payload: Omit<Project, "id"> = {
        name: form.name.trim() || "New Project",
        description: form.description.trim() || "Project description",
        client: form.client.trim(),
        ownerName: form.ownerName.trim(),
        siteName: form.siteName.trim(),
        location: form.location.trim(),
        linkedRecords: {
          company: buildRelation("company", form.linkedCompanyId),
          contact: buildRelation("contact", form.linkedContactId),
          deal: buildRelation("deal", form.linkedDealId),
        },
        status: form.status,
        priority: form.priority,
        progress: Number(form.progress || 0),
        team: Number(form.team || 0),
        budget: Number(form.budget || 0),
        spent: Number(form.spent || 0),
        startDate: form.startDate || new Date().toISOString().slice(0, 10),
        endDate: form.endDate || new Date().toISOString().slice(0, 10),
        proofLinks: normalizeLinks(form.proofLinks, "Project proof links"),
        externalLinks: normalizeLinks(form.externalLinks, "Project external links"),
      }

      if (editingId) {
        if (onUpdateProject) {
          onUpdateProject(editingId, payload)
        } else {
          setProjects((prev) => prev.map((item) => (item.id === editingId ? { id: editingId, ...payload } : item)))
        }
      } else if (onAddProject) {
        onAddProject(payload)
      } else {
        setProjects((prev) => [{ id: Date.now().toString(), ...payload }, ...prev])
      }

      setShowModal(false)
      setEditingId(null)
      setForm(emptyForm)
    } catch (error) {
      setEditorError(error instanceof Error ? error.message : "Failed to validate project details")
    }
  }

  const deleteProject = (id: string) => {
    if (onDeleteProject) onDeleteProject(id)
    else setProjects((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-2xl font-bold">{projects.filter((project) => project.status === "in-progress").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Budget</p>
            <p className="text-2xl font-bold text-primary">{formatNaira(projects.reduce((sum, project) => sum + project.budget, 0))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Proof + Links</p>
            <p className="text-2xl font-bold text-accent">
              {projects.reduce((sum, project) => sum + (project.proofLinks?.length || 0) + (project.externalLinks?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">CRM-linked</p>
            <p className="text-2xl font-bold">
              {projects.filter((project) => project.linkedRecords?.company || project.linkedRecords?.contact || project.linkedRecords?.deal).length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {pagedProjects.map((project) => {
          const budgetUtilization = project.budget > 0 ? ((project.spent / project.budget) * 100).toFixed(0) : "0"
          const relationBadges = [
            project.linkedRecords?.company ? `Company: ${project.linkedRecords.company.label}` : null,
            project.linkedRecords?.contact ? `Contact: ${project.linkedRecords.contact.label}` : null,
            project.linkedRecords?.deal ? `Deal: ${project.linkedRecords.deal.label}` : null,
          ].filter(Boolean) as string[]

          return (
            <Card key={project.id} className="transition-shadow hover:shadow-md">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      {project.client ? <p className="text-xs text-muted-foreground">Client: {project.client}</p> : null}
                      <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                      {relationBadges.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {relationBadges.map((item) => (
                            <Badge key={item} variant="outline" className="bg-muted/40">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">No CRM record linked yet.</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className={statusColors[project.status]}>
                        {project.status}
                      </Badge>
                      <Badge variant="outline" className={`flex items-center gap-1 ${priorityColors[project.priority]}`}>
                        <Flag className="h-3 w-3" />
                        {project.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary" style={{ width: `${project.progress}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-2 md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Timeline</p>
                        <p className="font-medium text-sm">
                          {project.startDate} - {project.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Team</p>
                        <p className="font-medium text-sm">{project.team} Members</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Budget</p>
                      <p className="font-medium text-sm">{formatNaira(project.budget)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Utilization</p>
                      <p className="font-medium text-sm">{budgetUtilization}%</p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm md:grid-cols-3">
                    <div>
                      <p className="font-medium">Owner / site</p>
                      <p className="mt-1 text-muted-foreground">
                        {[project.ownerName || "No owner", project.siteName || "No site"].join(" • ")}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Proof</p>
                      <p className="mt-1 text-muted-foreground">{project.proofLinks?.length || 0} proof item(s)</p>
                    </div>
                    <div>
                      <p className="font-medium">External systems</p>
                      <p className="mt-1 text-muted-foreground">{project.externalLinks?.length || 0} linked destination(s)</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedProject(project)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditor(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <RecordDetailsDialog
        open={Boolean(selectedProject)}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null)
        }}
        title={selectedProject?.name || "Project details"}
        description="Review CRM relationships, delivery proof, and execution links without leaving Projects."
        sections={
          selectedProject
            ? [
                {
                  title: "Project summary",
                  fields: [
                    { label: "Name", value: selectedProject.name },
                    { label: "Client", value: selectedProject.client || "—" },
                    { label: "Owner", value: selectedProject.ownerName || "—" },
                    { label: "Site", value: selectedProject.siteName || "—" },
                    { label: "Location", value: selectedProject.location || "—" },
                    { label: "Status", value: selectedProject.status },
                    { label: "Priority", value: selectedProject.priority },
                    { label: "Progress", value: `${selectedProject.progress}%` },
                    { label: "Budget", value: formatNaira(selectedProject.budget) },
                    { label: "Spent", value: formatNaira(selectedProject.spent) },
                    { label: "Timeline", value: `${selectedProject.startDate} → ${selectedProject.endDate}` },
                  ],
                },
                {
                  title: "CRM relationship",
                  fields: [
                    { label: "Company", value: selectedProject.linkedRecords?.company?.label || "No linked company" },
                    { label: "Contact", value: selectedProject.linkedRecords?.contact?.label || "No linked contact" },
                    { label: "Deal", value: selectedProject.linkedRecords?.deal?.label || "No linked deal" },
                    {
                      label: "Open CRM record",
                      value: selectedProject.linkedRecords?.deal?.id
                        ? `Deal in CRM: ${selectedProject.linkedRecords.deal.label}`
                        : selectedProject.linkedRecords?.company?.id
                          ? `Company in CRM: ${selectedProject.linkedRecords.company.label}`
                          : "Link a CRM record from Edit Project to enable direct handoff context",
                    },
                  ],
                },
                {
                  title: "Proof and external links",
                  fields: [
                    {
                      label: "Proof links",
                      value:
                        selectedProject.proofLinks?.length
                          ? selectedProject.proofLinks
                              .map((item) => [item.category, item.label || item.url].filter(Boolean).join(": "))
                              .join(", ")
                          : "No proof links added yet",
                    },
                    {
                      label: "External links",
                      value:
                        selectedProject.externalLinks?.length
                          ? selectedProject.externalLinks
                              .map((item) => [item.category, item.label || item.url].filter(Boolean).join(": "))
                              .join(", ")
                          : "No external links added yet",
                    },
                    {
                      label: "Uploads",
                      value: uploadsEnabled
                        ? "Storage provider is configured. You can add external proof links now and wire uploads where supported."
                        : "File upload requires storage provider validation. You can still add external proof links.",
                    },
                  ],
                },
              ]
            : []
        }
        footer={
          selectedProject ? (
            <div className="flex flex-wrap gap-2">
              {selectedProject.linkedRecords?.deal?.id ? (
                <Button asChild size="sm" variant="outline" className="bg-transparent">
                  <Link href="/dashboard/crm">
                    Open CRM record
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
              <Button size="sm" onClick={() => openEditor(selectedProject)}>
                Edit project links
              </Button>
            </div>
          ) : null
        }
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-5xl">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{editingId ? "Edit Project" : "Add Project"}</h3>
                  <p className="text-sm text-muted-foreground">Capture delivery scope, CRM handoff context, proof, and external systems.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {editorError ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{editorError}</p> : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Project name</Label>
                  <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Client</Label>
                  <Input value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Owner / lead</Label>
                  <Input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Site / workspace</Label>
                  <Input value={form.siteName} onChange={(event) => setForm({ ...form, siteName: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as Project["status"] })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <select
                    value={form.priority}
                    onChange={(event) => setForm({ ...form, priority: event.target.value as Project["priority"] })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Progress (%)</Label>
                  <Input type="number" value={form.progress} onChange={(event) => setForm({ ...form, progress: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Team size</Label>
                  <Input type="number" value={form.team} onChange={(event) => setForm({ ...form, team: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Budget</Label>
                  <Input type="number" value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Spent</Label>
                  <Input type="number" value={form.spent} onChange={(event) => setForm({ ...form, spent: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">Start date</Label>
                  <Input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
                </div>
                <div>
                  <Label className="text-sm font-medium">End date</Label>
                  <Input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 rounded-2xl border border-border/70 p-4 lg:grid-cols-3">
                <div>
                  <Label className="text-sm font-medium">Linked company</Label>
                  <select
                    value={form.linkedCompanyId}
                    onChange={(event) => setForm({ ...form, linkedCompanyId: event.target.value })}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="__none__">No linked company</option>
                    {crmCompanies.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Linked contact</Label>
                  <select
                    value={form.linkedContactId}
                    onChange={(event) => setForm({ ...form, linkedContactId: event.target.value })}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="__none__">No linked contact</option>
                    {crmContacts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Linked deal</Label>
                  <select
                    value={form.linkedDealId}
                    onChange={(event) => setForm({ ...form, linkedDealId: event.target.value })}
                    className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2"
                  >
                    <option value="__none__">No linked deal</option>
                    {crmDeals.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Project proof</h4>
                      <p className="text-xs text-muted-foreground">Attach deployment URLs, screenshots, documents, or client site references.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => addLinkRow("proofLinks")}>
                      Add proof
                    </Button>
                  </div>
                  {!uploadsEnabled ? (
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      File upload requires storage provider validation. You can still add external proof links.
                    </p>
                  ) : null}
                  {form.proofLinks.map((link, index) => (
                    <div key={`proof-${index}`} className="grid gap-3 rounded-xl border border-border/60 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input value={link.label} onChange={(event) => updateLinkRow("proofLinks", index, "label", event.target.value)} placeholder="QA screenshot" />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <select
                            value={link.category}
                            onChange={(event) => updateLinkRow("proofLinks", index, "category", event.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2"
                          >
                            <option value="">Select category</option>
                            {proofCategories.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input value={link.url} onChange={(event) => updateLinkRow("proofLinks", index, "url", event.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <Label className="text-xs">Proof note</Label>
                        <Textarea value={link.note} onChange={(event) => updateLinkRow("proofLinks", index, "note", event.target.value)} rows={2} placeholder="What does this prove or who should review it?" />
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLinkRow("proofLinks", index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 rounded-2xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">External links</h4>
                      <p className="text-xs text-muted-foreground">Keep GitHub, docs, deployment, monitoring, and ticket links with the project record.</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="bg-transparent" onClick={() => addLinkRow("externalLinks")}>
                      Add link
                    </Button>
                  </div>
                  {form.externalLinks.map((link, index) => (
                    <div key={`external-${index}`} className="grid gap-3 rounded-xl border border-border/60 p-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <Label className="text-xs">Label</Label>
                          <Input value={link.label} onChange={(event) => updateLinkRow("externalLinks", index, "label", event.target.value)} placeholder="Production deploy" />
                        </div>
                        <div>
                          <Label className="text-xs">Category</Label>
                          <select
                            value={link.category}
                            onChange={(event) => updateLinkRow("externalLinks", index, "category", event.target.value)}
                            className="w-full rounded-md border border-border bg-background px-3 py-2"
                          >
                            <option value="">Select category</option>
                            {externalCategories.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input value={link.url} onChange={(event) => updateLinkRow("externalLinks", index, "url", event.target.value)} placeholder="https://..." />
                      </div>
                      <div>
                        <Label className="text-xs">Note</Label>
                        <Textarea value={link.note} onChange={(event) => updateLinkRow("externalLinks", index, "note", event.target.value)} rows={2} placeholder="Why this link matters or who owns it." />
                      </div>
                      <div className="flex justify-end">
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeLinkRow("externalLinks", index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" className="bg-transparent" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={saveProject}>{editingId ? "Save changes" : "Add project"}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
