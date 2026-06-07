#!/usr/bin/env node

const baseUrl = process.env.BASE_URL?.trim()

if (!baseUrl) {
  console.error("FAIL BASE_URL is required. Example: BASE_URL=https://your-render-url npm run p0:smoke")
  process.exit(1)
}

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")

const cookieEnv = {
  founder: process.env.FOUNDER_COOKIE?.trim() || "",
  orgOwner: process.env.ORG_OWNER_COOKIE?.trim() || "",
  user: process.env.USER_COOKIE?.trim() || "",
}

const results = []

const pushResult = (status, area, item, detail, route = "") => {
  results.push({ status, area, item, detail, route })
}

const request = async (path, options = {}) => {
  const res = await fetch(`${normalizedBaseUrl}${path}`, {
    redirect: "manual",
    ...options,
    headers: {
      "user-agent": "civis-p0-smoke-check/1.0",
      ...(options.headers || {}),
    },
  })
  return res
}

const expectPublicOk = async (path, area, item) => {
  try {
    const res = await request(path)
    if (res.status >= 200 && res.status < 400) {
      pushResult("PASS", area, item, `Received status ${res.status}`, path)
    } else {
      pushResult("FAIL", area, item, `Expected public success, got ${res.status}`, path)
    }
  } catch (error) {
    pushResult("FAIL", area, item, error instanceof Error ? error.message : "Unknown fetch error", path)
  }
}

const expectProtectedBlocked = async (path, area, item) => {
  try {
    const res = await request(path)
    if ([401, 403, 302, 303, 307, 308].includes(res.status)) {
      pushResult("PASS", area, item, `Protected route blocked with ${res.status}`, path)
      return
    }
    if (res.status >= 200 && res.status < 300) {
      pushResult("FAIL", area, item, `Expected blocked route, got ${res.status}`, path)
      return
    }
    pushResult("PASS", area, item, `Protected route returned non-success status ${res.status}`, path)
  } catch (error) {
    pushResult("FAIL", area, item, error instanceof Error ? error.message : "Unknown fetch error", path)
  }
}

const expectWithCookie = async ({ path, area, item, cookie, expectedStatuses, blockedStatuses }) => {
  if (!cookie) {
    pushResult("BLOCKED", area, item, "Missing cookie env for this role check", path)
    return
  }

  try {
    const res = await request(path, {
      headers: {
        cookie,
      },
    })

    if (expectedStatuses?.includes(res.status)) {
      pushResult("PASS", area, item, `Received expected status ${res.status}`, path)
      return
    }

    if (blockedStatuses?.includes(res.status)) {
      pushResult("PASS", area, item, `Access correctly blocked with ${res.status}`, path)
      return
    }

    pushResult(
      "FAIL",
      area,
      item,
      `Unexpected status ${res.status}; expected one of ${[...(expectedStatuses || []), ...(blockedStatuses || [])].join(", ")}`,
      path,
    )
  } catch (error) {
    pushResult("FAIL", area, item, error instanceof Error ? error.message : "Unknown fetch error", path)
  }
}

const run = async () => {
  pushResult("PASS", "Preflight", "BASE_URL provided", normalizedBaseUrl)

  await expectPublicOk("/", "Public routes", "Homepage loads")
  await expectPublicOk("/login", "Auth and access", "Login page loads")
  await expectPublicOk("/pricing", "Billing", "Pricing page loads")

  await expectProtectedBlocked("/dashboard", "Auth and access", "Logged-out dashboard access is blocked")
  await expectProtectedBlocked("/admin", "Auth and access", "Logged-out admin access is blocked")
  await expectProtectedBlocked("/api/admin/orgs", "Admin and org boundary", "Logged-out admin org API access is blocked")
  await expectProtectedBlocked(
    "/api/admin/platform-status",
    "Admin and org boundary",
    "Logged-out platform status API access is blocked",
  )

  await expectWithCookie({
    path: "/admin",
    area: "Admin and org boundary",
    item: "Founder can access admin root",
    cookie: cookieEnv.founder,
    expectedStatuses: [200],
  })
  await expectWithCookie({
    path: "/admin/system",
    area: "Admin and org boundary",
    item: "Founder can access system page",
    cookie: cookieEnv.founder,
    expectedStatuses: [200],
  })
  await expectWithCookie({
    path: "/api/admin/orgs",
    area: "Admin and org boundary",
    item: "Founder can access platform org API",
    cookie: cookieEnv.founder,
    expectedStatuses: [200],
  })

  await expectWithCookie({
    path: "/admin/system",
    area: "Admin and org boundary",
    item: "Org owner cannot access system page",
    cookie: cookieEnv.orgOwner,
    blockedStatuses: [401, 403, 302, 303, 307, 308],
  })
  await expectWithCookie({
    path: "/api/admin/orgs",
    area: "Admin and org boundary",
    item: "Org owner cannot access platform org API",
    cookie: cookieEnv.orgOwner,
    blockedStatuses: [401, 403],
  })
  await expectWithCookie({
    path: "/api/admin/platform-status",
    area: "Admin and org boundary",
    item: "Org owner cannot access platform status API",
    cookie: cookieEnv.orgOwner,
    blockedStatuses: [401, 403],
  })
  await expectWithCookie({
    path: "/admin/users",
    area: "Admin and org boundary",
    item: "Org owner can access workspace users page",
    cookie: cookieEnv.orgOwner,
    expectedStatuses: [200],
  })

  pushResult(
    "BLOCKED",
    "Invite flow",
    "Invite creation, acceptance, org attachment, and role assignment",
    "Manual/browser validation required; script does not create users or mutate production data by default",
  )
  pushResult(
    "BLOCKED",
    "Accounting and approvals",
    "Invoice/expense approval lifecycle",
    "Manual/browser validation required to avoid write mutations by default",
  )
  pushResult(
    "BLOCKED",
    "CRM",
    "Create/edit/delete persistence",
    "Manual/browser validation required to avoid write mutations by default",
  )
  pushResult(
    "BLOCKED",
    "Operations",
    "Approvals list actions and workflow mutations",
    "Manual/browser validation required to avoid write mutations by default",
  )
  pushResult(
    "BLOCKED",
    "Settings",
    "Profile/workspace save validation",
    "Manual/browser validation required to avoid write mutations by default",
  )
  pushResult(
    "BLOCKED",
    "Uploads",
    "Cloudinary configured/missing behavior",
    "Manual validation required because uploads are write operations",
  )
  pushResult(
    "BLOCKED",
    "Notifications",
    "Notification persistence validation",
    "Manual validation required because notification creation is a write operation",
  )
  pushResult(
    "BLOCKED",
    "Environment validation",
    "Server-side env presence",
    "Remote server env values cannot be verified safely from this script; use the evidence pack checklist",
  )

  let failed = 0
  let blocked = 0

  for (const result of results) {
    if (result.status === "FAIL") failed += 1
    if (result.status === "BLOCKED") blocked += 1
    const routeSuffix = result.route ? ` [${result.route}]` : ""
    console.log(`${result.status} ${result.area} :: ${result.item}${routeSuffix} :: ${result.detail}`)
  }

  console.log("")
  console.log(`Summary: ${results.length} checks, ${failed} fail, ${blocked} blocked`)

  if (failed > 0) {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error("FAIL Smoke runner crashed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
