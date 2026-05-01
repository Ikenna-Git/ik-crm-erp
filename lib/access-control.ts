import { isAdmin, isSuperAdmin } from "@/lib/authz"

export const ACCESS_LEVELS = ["hidden", "view", "manage"] as const
export type AccessLevel = (typeof ACCESS_LEVELS)[number]

export const ACCESS_PROFILES = [
  "GENERAL",
  "SALES",
  "MARKETING",
  "SUPPORT",
  "FINANCE",
  "HR",
  "OPERATIONS",
  "PROJECT_MANAGER",
  "INVENTORY",
  "EXECUTIVE",
  "ADMINISTRATION",
] as const

export type AccessProfile = (typeof ACCESS_PROFILES)[number]
export type PlatformRole = "SUPER_ADMIN" | "ORG_OWNER" | "ADMIN" | "USER"

export const ACCESS_MODULES = [
  "overview",
  "ai",
  "crm",
  "marketing",
  "portal",
  "accounting",
  "inventory",
  "projects",
  "hr",
  "gallery",
  "docs",
  "demo",
  "playbooks",
  "analytics",
  "operations",
  "settings",
  "admin",
] as const

export type AccessModule = (typeof ACCESS_MODULES)[number]
export type ModuleAccessMap = Record<AccessModule, AccessLevel>
export type ModuleAccessInput = Partial<Record<AccessModule, AccessLevel>>

export type AccessSubject = {
  role?: string | null
  accessProfile?: string | null
  moduleAccess?: unknown
}

export const ACCESS_MODULE_LABELS: Record<AccessModule, string> = {
  overview: "Overview",
  ai: "Civis AI",
  crm: "CRM",
  marketing: "Marketing",
  portal: "Client Portal",
  accounting: "Accounting",
  inventory: "Inventory",
  projects: "Projects",
  hr: "HR",
  gallery: "Gallery",
  docs: "Docs",
  demo: "Demo",
  playbooks: "Playbooks",
  analytics: "Analytics",
  operations: "Operations",
  settings: "Settings",
  admin: "Admin",
}

export const ACCESS_PROFILE_LABELS: Record<AccessProfile, string> = {
  GENERAL: "General workspace",
  SALES: "Sales",
  MARKETING: "Marketing",
  SUPPORT: "Support",
  FINANCE: "Finance",
  HR: "Human resources",
  OPERATIONS: "Operations",
  PROJECT_MANAGER: "Project manager",
  INVENTORY: "Inventory",
  EXECUTIVE: "Executive",
  ADMINISTRATION: "Administration",
}

export const ACCESS_PROFILE_DESCRIPTIONS: Record<AccessProfile, string> = {
  GENERAL: "Core workspace access for day-to-day collaboration.",
  SALES: "CRM-heavy access for pipeline, follow-ups, and client coordination.",
  MARKETING: "Campaign, gallery, and reporting access for demand generation.",
  SUPPORT: "Portal and service visibility for support teams.",
  FINANCE: "Accounting and reporting access for finance operations.",
  HR: "Employee, payroll, and attendance access for people operations.",
  OPERATIONS: "Automation, workflows, and execution access for ops teams.",
  PROJECT_MANAGER: "Project delivery access across tasks, timelines, and status.",
  INVENTORY: "Stock, product, and order access for inventory teams.",
  EXECUTIVE: "Read-heavy cross-functional visibility for leadership.",
  ADMINISTRATION: "Broad workspace access for internal administrators.",
}

const DASHBOARD_PATH_ORDER: Array<{ href: string; module: AccessModule }> = [
  { href: "/dashboard", module: "overview" },
  { href: "/dashboard/ai", module: "ai" },
  { href: "/dashboard/crm", module: "crm" },
  { href: "/dashboard/marketing", module: "marketing" },
  { href: "/dashboard/portal", module: "portal" },
  { href: "/dashboard/accounting", module: "accounting" },
  { href: "/dashboard/inventory", module: "inventory" },
  { href: "/dashboard/projects", module: "projects" },
  { href: "/dashboard/hr", module: "hr" },
  { href: "/dashboard/gallery", module: "gallery" },
  { href: "/dashboard/docs", module: "docs" },
  { href: "/dashboard/demo", module: "demo" },
  { href: "/dashboard/playbooks", module: "playbooks" },
  { href: "/dashboard/analytics", module: "analytics" },
  { href: "/dashboard/operations", module: "operations" },
  { href: "/dashboard/settings", module: "settings" },
]

const accessRank: Record<AccessLevel, number> = {
  hidden: 0,
  view: 1,
  manage: 2,
}

const createEmptyAccess = (): ModuleAccessMap =>
  ACCESS_MODULES.reduce(
    (acc, module) => {
      acc[module] = "hidden"
      return acc
    },
    {} as ModuleAccessMap,
  )

const applyAccess = (base: ModuleAccessMap, entries: Partial<Record<AccessModule, AccessLevel>>) => {
  Object.entries(entries).forEach(([module, level]) => {
    if (!level || !ACCESS_MODULES.includes(module as AccessModule) || !ACCESS_LEVELS.includes(level)) {
      return
    }
    base[module as AccessModule] = level
  })
  return base
}

const createManagedAccess = (modules: AccessModule[]) => applyAccess(createEmptyAccess(), Object.fromEntries(modules.map((module) => [module, "manage"])))

const createViewedAccess = (modules: AccessModule[]) => applyAccess(createEmptyAccess(), Object.fromEntries(modules.map((module) => [module, "view"])))

const workspaceWideManage = applyAccess(
  createManagedAccess([
    "overview",
    "ai",
    "crm",
    "marketing",
    "portal",
    "accounting",
    "inventory",
    "projects",
    "hr",
    "gallery",
    "docs",
    "demo",
    "playbooks",
    "analytics",
    "operations",
    "settings",
    "admin",
  ]),
  {},
)

const accessProfiles: Record<AccessProfile, ModuleAccessMap> = {
  GENERAL: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings"]), {
    demo: "view",
  }),
  SALES: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings", "portal"]), {
    crm: "manage",
  }),
  MARKETING: applyAccess(createViewedAccess(["overview", "ai", "crm", "docs", "analytics", "settings"]), {
    marketing: "manage",
    gallery: "manage",
  }),
  SUPPORT: applyAccess(createViewedAccess(["overview", "ai", "crm", "docs", "analytics", "settings", "operations"]), {
    portal: "manage",
  }),
  FINANCE: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings"]), {
    accounting: "manage",
  }),
  HR: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings"]), {
    hr: "manage",
  }),
  OPERATIONS: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings", "projects", "portal"]), {
    operations: "manage",
    playbooks: "manage",
  }),
  PROJECT_MANAGER: applyAccess(createViewedAccess(["overview", "ai", "crm", "docs", "analytics", "settings"]), {
    projects: "manage",
  }),
  INVENTORY: applyAccess(createViewedAccess(["overview", "ai", "docs", "analytics", "settings"]), {
    inventory: "manage",
  }),
  EXECUTIVE: applyAccess(
    createViewedAccess([
      "overview",
      "ai",
      "crm",
      "marketing",
      "portal",
      "accounting",
      "inventory",
      "projects",
      "hr",
      "gallery",
      "docs",
      "demo",
      "playbooks",
      "analytics",
      "operations",
      "settings",
    ]),
    {},
  ),
  ADMINISTRATION: applyAccess(workspaceWideManage, {}),
}

const buildRoleAccess = (role?: string | null): ModuleAccessMap => {
  if (isAdmin(role) || isSuperAdmin(role)) {
    return { ...workspaceWideManage }
  }
  return createEmptyAccess()
}

export const normalizeAccessProfile = (value?: string | null): AccessProfile => {
  const normalized = String(value || "").trim().toUpperCase()
  return ACCESS_PROFILES.includes(normalized as AccessProfile) ? (normalized as AccessProfile) : "GENERAL"
}

export const normalizeModuleAccess = (value: unknown): ModuleAccessInput => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  const normalized: ModuleAccessInput = {}
  for (const [key, level] of Object.entries(value)) {
    if (!ACCESS_MODULES.includes(key as AccessModule)) continue
    if (!ACCESS_LEVELS.includes(level as AccessLevel)) continue
    normalized[key as AccessModule] = level as AccessLevel
  }
  return normalized
}

export const getDefaultAccessProfileForRole = (role?: string | null): AccessProfile => {
  if (role === "SUPER_ADMIN" || role === "ADMIN") return "ADMINISTRATION"
  if (role === "ORG_OWNER") return "EXECUTIVE"
  return "GENERAL"
}

export const getAccessProfileTemplate = (profile?: string | null): ModuleAccessMap => {
  const normalized = normalizeAccessProfile(profile)
  return { ...accessProfiles[normalized] }
}

export const buildModuleAccessForUser = ({
  role,
  accessProfile,
  moduleAccess,
}: {
  role?: string | null
  accessProfile?: string | null
  moduleAccess?: unknown
}): ModuleAccessMap => {
  const roleDefaults = buildRoleAccess(role)

  if (isAdmin(role) || isSuperAdmin(role)) {
    const overrides = normalizeModuleAccess(moduleAccess)
    return applyAccess(roleDefaults, overrides)
  }

  const profileDefaults = getAccessProfileTemplate(accessProfile)
  const overrides = normalizeModuleAccess(moduleAccess)
  return applyAccess(profileDefaults, overrides)
}

export const hasModuleAccess = (subject: AccessSubject, module: AccessModule, required: AccessLevel = "view") => {
  const access = buildModuleAccessForUser(subject)
  return accessRank[access[module]] >= accessRank[required]
}

export const summarizeModuleAccess = (subject: AccessSubject, limit = 4) => {
  const access = buildModuleAccessForUser(subject)
  const visible = ACCESS_MODULES.filter((module) => access[module] !== "hidden" && module !== "overview" && module !== "settings")
  return visible.slice(0, limit).map((module) => ACCESS_MODULE_LABELS[module])
}

export const getDashboardModuleFromPath = (pathname: string) => {
  if (!pathname.startsWith("/dashboard")) return null
  const match = DASHBOARD_PATH_ORDER.find((entry) =>
    entry.href === "/dashboard" ? pathname === entry.href : pathname === entry.href || pathname.startsWith(entry.href + "/"),
  )
  return match?.module || null
}

export const getFirstAccessibleDashboardPath = (subject: AccessSubject) => {
  const match = DASHBOARD_PATH_ORDER.find((entry) => hasModuleAccess(subject, entry.module, "view"))
  return match?.href || "/dashboard/settings"
}
