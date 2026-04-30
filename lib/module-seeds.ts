import { prisma } from "@/lib/prisma"

const monthLabel = (index: number) =>
  new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(2025, index % 12, 1))

export const seedHrData = async (orgId: string) => {
  const [employeeCount, positionCount, payrollCount, attendanceCount] = await Promise.all([
    prisma.employee.count({ where: { orgId } }),
    prisma.position.count({ where: { orgId } }),
    prisma.payrollRecord.count({ where: { orgId } }),
    prisma.attendanceRecord.count({ where: { orgId } }),
  ])

  if (employeeCount || positionCount || payrollCount || attendanceCount) return

  const positions = [
    { title: "Senior Developer", department: "Engineering", headcount: 4, status: "filled" },
    { title: "Account Executive", department: "Sales", headcount: 3, status: "open" },
    { title: "HR Manager", department: "HR", headcount: 1, status: "filled" },
    { title: "Finance Analyst", department: "Finance", headcount: 2, status: "open" },
    { title: "Operations Lead", department: "Operations", headcount: 2, status: "filled" },
    { title: "Growth Manager", department: "Marketing", headcount: 2, status: "paused" },
  ]

  await prisma.position.createMany({
    data: positions.map((position, idx) => ({
      orgId,
      title: position.title,
      department: position.department,
      headcount: position.headcount,
      status: position.status,
      createdAt: new Date(2025, idx, 5),
      updatedAt: new Date(2025, idx, 18),
    })),
  })

  const savedPositions = await prisma.position.findMany({ where: { orgId } })
  const positionMap = new Map(savedPositions.map((position) => [`${position.title}-${position.department}`, position.id]))

  const employees: Array<[string, string, string, string, number]> = [
    ["Adaeze Okafor", "Engineering", "Senior Developer", "active", 420000],
    ["Musa Ibrahim", "Sales", "Account Executive", "active", 310000],
    ["Chinonso Eze", "HR", "HR Manager", "active", 365000],
    ["Tosin Adeyemi", "Finance", "Finance Analyst", "leave", 295000],
    ["Amaka Nnadi", "Operations", "Operations Lead", "active", 340000],
    ["Kelechi Umeh", "Marketing", "Growth Manager", "inactive", 285000],
    ["Grace Martins", "Engineering", "Senior Developer", "active", 405000],
    ["Noah Brown", "Operations", "Operations Lead", "active", 330000],
  ]

  const createdEmployees = []
  for (let index = 0; index < employees.length; index += 1) {
    const [name, department, title, status, salary] = employees[index]
    const employee = await prisma.employee.create({
      data: {
        orgId,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@civis.io`,
        phone: `+234 80${index + 10} ${String(1000000 + index * 731).slice(0, 7)}`,
        department,
        positionId: positionMap.get(`${title}-${department}`),
        startDate: new Date(2024, index % 8, 8 + index),
        status,
        salary,
      },
    })
    createdEmployees.push(employee)
  }

  await prisma.payrollRecord.createMany({
    data: createdEmployees.flatMap((employee, idx) =>
      Array.from({ length: 2 }, (_, runIdx) => {
        const baseSalary = employee.salary
        const bonus = runIdx === 0 ? 25000 : 15000
        const deductions = Math.round(baseSalary * 0.12)
        return {
          orgId,
          employeeId: employee.id,
          employeeName: employee.name,
          period: monthLabel(idx + runIdx),
          baseSalary,
          bonus,
          deductions,
          netPay: baseSalary + bonus - deductions,
          status: runIdx % 2 === 0 ? "pending" : "paid",
          createdAt: new Date(2025, (idx + runIdx) % 12, 2),
          updatedAt: new Date(2025, (idx + runIdx) % 12, 4),
        }
      }),
    ),
  })

  await prisma.attendanceRecord.createMany({
    data: createdEmployees.map((employee, idx) => ({
      orgId,
      employeeId: employee.id,
      employeeName: employee.name,
      date: new Date(2025, 1, 7),
      status: idx % 5 === 0 ? "on-leave" : idx % 4 === 0 ? "late" : idx % 3 === 0 ? "remote" : "present",
      checkIn: idx % 5 === 0 ? null : idx % 4 === 0 ? "09:24 AM" : "08:55 AM",
      checkOut: idx % 5 === 0 ? null : "05:32 PM",
      hoursWorked: idx % 5 === 0 ? 0 : idx % 3 === 0 ? 7.5 : 8.4,
      leaveType: idx % 5 === 0 ? "Annual" : null,
      leaveStart: idx % 5 === 0 ? new Date(2025, 1, 5) : null,
      leaveEnd: idx % 5 === 0 ? new Date(2025, 1, 12) : null,
      remindOnReturn: idx % 5 === 0,
      note: idx % 4 === 0 ? "Traffic delay reported." : null,
    })),
  })
}

export const seedProjectData = async (orgId: string) => {
  const [projectCount, taskCount] = await Promise.all([
    prisma.project.count({ where: { orgId } }),
    prisma.projectTask.count({ where: { orgId } }),
  ])

  if (projectCount || taskCount) return

  const projectSeeds = [
    ["Civis Web Redesign", "Refresh the marketing site and dashboard shell.", "Civis Internal", "planning", "high"],
    ["Client Portal Expansion", "Add approvals, documents, and status tracking.", "Northwind", "in-progress", "medium"],
    ["Finance Automation Rollout", "Tighten reports and overdue invoice workflows.", "Finance", "in-progress", "high"],
    ["HR Leave Workflow", "Standardize attendance, leave, and return reminders.", "People Ops", "on-hold", "medium"],
    ["Operations Command Center", "Ship live KPIs and resilient workflow triggers.", "Operations", "completed", "high"],
  ] as const

  const projects = []
  for (let index = 0; index < projectSeeds.length; index += 1) {
    const [name, description, client, status, priority] = projectSeeds[index]
    const project = await prisma.project.create({
      data: {
        orgId,
        name,
        description,
        client,
        status,
        priority,
        progress: status === "completed" ? 100 : 30 + index * 12,
        team: 3 + index,
        budget: 1_500_000 + index * 250_000,
        spent: 480_000 + index * 135_000,
        startDate: new Date(2025, index, 3),
        endDate: new Date(2025, index + 1, 24),
      },
    })
    projects.push(project)
  }

  const taskStages = ["todo", "in-progress", "review", "done"] as const
  const priorities = ["low", "medium", "high"] as const

  await prisma.projectTask.createMany({
    data: projects.flatMap((project, idx) =>
      Array.from({ length: 5 }, (_, taskIdx) => ({
        orgId,
        projectId: project.id,
        title: `Task ${taskIdx + 1} for ${project.name}`,
        assignee: ["Adaeze", "Musa", "Grace", "Noah", "Amaka"][(idx + taskIdx) % 5],
        startDate: new Date(2025, idx, 4 + taskIdx),
        endDate: new Date(2025, idx, 10 + taskIdx * 2),
        priority: priorities[(idx + taskIdx) % priorities.length],
        stage: taskStages[(idx + taskIdx) % taskStages.length],
      })),
    ),
  })
}

export const seedInventoryData = async (orgId: string) => {
  const [productCount, stockCount, orderCount] = await Promise.all([
    prisma.inventoryProduct.count({ where: { orgId } }),
    prisma.inventoryStock.count({ where: { orgId } }),
    prisma.purchaseOrder.count({ where: { orgId } }),
  ])

  if (productCount || stockCount || orderCount) return

  const products = [
    ["PROD-0001", 'Laptop Pro 15"', "Electronics", 1_350_000, 980_000, "TechGear", "active"],
    ["PROD-0002", "Wireless Mouse", "Accessories", 95_000, 42_000, "PeripheralCo", "active"],
    ["PROD-0003", "USB-C Cable", "Cables", 25_000, 8_500, "CableMaster", "active"],
    ["PROD-0004", 'Monitor 4K 27"', "Electronics", 610_000, 430_000, "DisplayTech", "active"],
    ["PROD-0005", "Desk Lamp", "Office", 75_000, 29_000, "OfficeWorks", "inactive"],
    ["PROD-0006", "Docking Station", "Accessories", 220_000, 140_000, "Nimbus Supply", "discontinued"],
  ] as const

  await prisma.inventoryProduct.createMany({
    data: products.map(([sku, name, category, price, cost, supplier, status], idx) => ({
      orgId,
      sku,
      name,
      category,
      price,
      cost,
      supplier,
      status,
      createdAt: new Date(2025, idx, 8),
      updatedAt: new Date(2025, idx, 18),
    })),
  })

  await prisma.inventoryStock.createMany({
    data: products.map(([sku, name], idx) => ({
      orgId,
      sku,
      name,
      currentStock: 12 + idx * 5,
      reorderPoint: 10 + (idx % 4) * 5,
      reorderQuantity: 18 + idx * 4,
      warehouseLocation: `A-${idx + 1}-${(idx % 3) + 1}`,
      status: idx % 5 === 0 ? "critical" : idx % 2 === 0 ? "low" : "ok",
      createdAt: new Date(2025, idx, 8),
      updatedAt: new Date(2025, idx, 18),
    })),
  })

  await prisma.purchaseOrder.createMany({
    data: Array.from({ length: 8 }, (_, idx) => ({
      orgId,
      orderNo: `PO-2025-${String(idx + 1).padStart(3, "0")}`,
      supplier: ["TechGear", "PeripheralCo", "CableMaster", "OfficeWorks"][idx % 4],
      items: 10 + idx * 3,
      totalValue: 250_000 + idx * 95_000,
      orderDate: new Date(2025, idx % 6, 2 + idx),
      expectedDelivery: new Date(2025, idx % 6, 10 + idx),
      status: ["draft", "ordered", "in-transit", "delivered"][idx % 4],
      createdAt: new Date(2025, idx % 6, 2 + idx),
      updatedAt: new Date(2025, idx % 6, 4 + idx),
    })),
  })
}
