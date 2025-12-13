// Simple in-memory store for demo purposes. Replace with a real database for production use.
export type Role = "super_admin" | "admin" | "user"

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type Org = {
  id: string
  name: string
  theme: "light" | "dark" | "blue"
  notifyEmail: string
}

export type Contact = {
  id: string
  name: string
  email: string
  phone?: string
  companyId?: string
  tags?: string[]
  ownerId?: string
  notes?: string
}

export type Company = {
  id: string
  name: string
  industry?: string
  size?: string
  ownerId?: string
}

export type DealStage = "prospect" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
export type Deal = {
  id: string
  title: string
  value: number
  stage: DealStage
  companyId?: string
  contactId?: string
  ownerId?: string
  expectedClose?: string
}

export type Task = {
  id: string
  title: string
  dueDate?: string
  status: "open" | "done"
  ownerId?: string
  relatedType?: "deal" | "contact" | "company"
  relatedId?: string
}

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"
export type Invoice = {
  id: string
  invoiceNumber: string
  clientName: string
  amount: number
  status: InvoiceStatus
  dueDate?: string
}

export type Expense = {
  id: string
  description: string
  amount: number
  category: string
  date?: string
}

type Store = {
  org: Org
  users: User[]
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
  tasks: Task[]
  invoices: Invoice[]
  expenses: Expense[]
}

const store: Store = {
  org: {
    id: "org-1",
    name: "Ikenna",
    theme: "light",
    notifyEmail: "ikchils@gmail.com",
  },
  users: [
    { id: "u-1", name: "Ikenna Chilokwu", email: "ikchils@gmail.com", role: "super_admin" },
    { id: "u-2", name: "Admin User", email: "admin@example.com", role: "admin" },
  ],
  contacts: [
    { id: "c-1", name: "Ada Lovelace", email: "ada@example.com", phone: "+2348012345678", tags: ["priority"] },
    { id: "c-2", name: "John Doe", email: "john@example.com", companyId: "co-1" },
  ],
  companies: [{ id: "co-1", name: "Acme Corp", industry: "Manufacturing", size: "50-100" }],
  deals: [
    { id: "d-1", title: "ERP Implementation", value: 1200000, stage: "proposal", companyId: "co-1", contactId: "c-2" },
  ],
  tasks: [{ id: "t-1", title: "Follow up with Acme", status: "open", relatedType: "deal", relatedId: "d-1" }],
  invoices: [
    { id: "inv-1", invoiceNumber: "INV-001", clientName: "Acme Corp", amount: 500000, status: "sent", dueDate: "2025-12-31" },
  ],
  expenses: [{ id: "exp-1", description: "Cloud hosting", amount: 120000, category: "infrastructure", date: "2025-12-01" }],
}

const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

export const db = {
  getSnapshot: () => store,
  updateOrg: (data: Partial<Org>) => Object.assign(store.org, data),

  listUsers: () => store.users,
  addUser: (user: Omit<User, "id">) => {
    const u = { ...user, id: genId("u") }
    store.users.push(u)
    return u
  },

  listContacts: () => store.contacts,
  addContact: (contact: Omit<Contact, "id">) => {
    const c = { ...contact, id: genId("c") }
    store.contacts.push(c)
    return c
  },

  listCompanies: () => store.companies,
  addCompany: (company: Omit<Company, "id">) => {
    const co = { ...company, id: genId("co") }
    store.companies.push(co)
    return co
  },

  listDeals: () => store.deals,
  addDeal: (deal: Omit<Deal, "id">) => {
    const d = { ...deal, id: genId("d") }
    store.deals.push(d)
    return d
  },
  updateDealStage: (id: string, stage: DealStage) => {
    const d = store.deals.find((x) => x.id === id)
    if (d) d.stage = stage
    return d
  },

  listTasks: () => store.tasks,
  addTask: (task: Omit<Task, "id">) => {
    const t = { ...task, id: genId("t") }
    store.tasks.push(t)
    return t
  },
  completeTask: (id: string) => {
    const t = store.tasks.find((x) => x.id === id)
    if (t) t.status = "done"
    return t
  },

  listInvoices: () => store.invoices,
  addInvoice: (invoice: Omit<Invoice, "id">) => {
    const inv = { ...invoice, id: genId("inv") }
    store.invoices.push(inv)
    return inv
  },
  listExpenses: () => store.expenses,
  addExpense: (expense: Omit<Expense, "id">) => {
    const ex = { ...expense, id: genId("exp") }
    store.expenses.push(ex)
    return ex
  },
}
