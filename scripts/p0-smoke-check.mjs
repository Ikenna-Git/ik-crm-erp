#!/usr/bin/env node

const baseUrl = process.env.BASE_URL?.trim()
const debug = process.env.P0_SMOKE_DEBUG === "1"
const timeoutMs = Number.parseInt(process.env.P0_SMOKE_TIMEOUT_MS || "15000", 10)
const retries = Number.parseInt(process.env.P0_SMOKE_RETRIES || "2", 10)
const retryDelayMs = Number.parseInt(process.env.P0_SMOKE_RETRY_DELAY_MS || "3000", 10)

if (!baseUrl) {
  console.error("FAIL Preflight :: BASE_URL missing :: Set BASE_URL=https://your-render-url before running p0:smoke")
  process.exit(1)
}

const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")

const cookieEnv = {
  founder: process.env.FOUNDER_COOKIE?.trim() || "",
  orgOwner: process.env.ORG_OWNER_COOKIE?.trim() || "",
  user: process.env.USER_COOKIE?.trim() || "",
}

const results = []

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const sanitizeMessage = (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "")

const getHeader = (res, name) => {
  try {
    return res.headers.get(name)
  } catch {
    return null
  }
}

const isLoginRedirect = (res) => {
  const location = getHeader(res, "location") || ""
  if (!location) return false
  return /\/login(?:[/?#]|$)/i.test(location)
}

const classifyFetchError = (error) => {
  const err = error instanceof Error ? error : new Error(String(error))
  const cause = typeof err.cause === "object" && err.cause !== null ? err.cause : {}
  const code = typeof cause.code === "string" ? cause.code : typeof err.code === "string" ? err.code : ""
  const message = sanitizeMessage(err.message)
  const lowerMessage = message.toLowerCase()

  let reason = "UNKNOWN_FETCH_ERROR"
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || lowerMessage.includes("getaddrinfo")) {
    reason = "DNS_ERROR"
  } else if (code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT" || lowerMessage.includes("timed out")) {
    reason = "TIMEOUT"
  } else if (code === "ECONNREFUSED") {
    reason = "CONNECTION_REFUSED"
  } else if (code === "ECONNRESET" || lowerMessage.includes("socket hang up")) {
    reason = "CONNECTION_RESET"
  } else if (
    code === "ERR_TLS_CERT_ALTNAME_INVALID" ||
    code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
    lowerMessage.includes("certificate") ||
    lowerMessage.includes("tls")
  ) {
    reason = "TLS_ERROR"
  } else if (message) {
    reason = "NETWORK_ERROR"
  }

  return {
    status: "BLOCKED",
    reason,
    errorName: err.name || "Error",
    errorMessage: message || "Fetch failed before receiving an HTTP response",
    causeCode: code || "",
  }
}

const formatElapsed = (elapsedMs) => `${elapsedMs}ms`

const formatNetworkDetail = ({ reason, errorName, errorMessage, causeCode, elapsedMs, attempt }) => {
  const parts = [
    reason,
    `error=${errorName || "Error"}`,
    `message=${errorMessage || "Fetch failed before receiving an HTTP response"}`,
  ]
  if (causeCode) parts.push(`cause=${causeCode}`)
  if (typeof attempt === "number") parts.push(`attempt=${attempt}`)
  parts.push(`elapsed=${formatElapsed(elapsedMs)}`)
  return parts.join(" :: ")
}

const formatResponseDetail = ({ label, res, elapsedMs }) => {
  const location = getHeader(res, "location")
  const parts = [`${label} ${res.status}`, `elapsed=${formatElapsed(elapsedMs)}`]
  if (debug) {
    parts.push(`finalUrl=${res.url || "unknown"}`)
    if (location) parts.push(`location=${location}`)
  }
  return parts.join(" :: ")
}

const pushResult = (status, area, item, detail, route = "", extra = {}) => {
  results.push({ status, area, item, detail, route, ...extra })
}

const hasSensitiveLeak = (value) => {
  if (!value || typeof value !== "object") return false
  if (Array.isArray(value)) return value.some((item) => hasSensitiveLeak(item))
  return Object.entries(value).some(([key, item]) => {
    const lowered = key.toLowerCase()
    if (
      ["secret", "token", "password", "apikey", "api_key", "privatekey", "private_key", "dsn"].includes(lowered) &&
      typeof item === "string" &&
      item.trim()
    ) {
      return true
    }
    return typeof item === "object" && item !== null ? hasSensitiveLeak(item) : false
  })
}

const requestOnce = async (path, options = {}) => {
  const controller = new AbortController()
  const startedAt = Date.now()
  const timer = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)

  try {
    const res = await fetch(`${normalizedBaseUrl}${path}`, {
      redirect: "manual",
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "civis-p0-smoke-check/1.0",
        ...(options.headers || {}),
      },
    })
    return {
      ok: true,
      response: res,
      elapsedMs: Date.now() - startedAt,
    }
  } catch (error) {
    const elapsedMs = Date.now() - startedAt
    const classified = classifyFetchError(error)
    return {
      ok: false,
      ...classified,
      elapsedMs,
    }
  } finally {
    clearTimeout(timer)
  }
}

const requestWithRetry = async (path, options = {}) => {
  let lastResult = null

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    const result = await requestOnce(path, options)
    if (result.ok) {
      return { ...result, attempt }
    }

    lastResult = { ...result, attempt }
    if (attempt <= retries) {
      await delay(retryDelayMs)
    }
  }

  return lastResult
}

const markBlockedByWarmup = (path, area, item, warmupResult) => {
  pushResult(
    "BLOCKED",
    area,
    item,
    `WARMUP_BLOCKED :: ${warmupResult.reason} :: ${warmupResult.errorMessage}${warmupResult.causeCode ? ` :: cause=${warmupResult.causeCode}` : ""}`,
    path,
    { reason: warmupResult.reason },
  )
}

const expectPublicOk = async (path, area, item) => {
  const result = await requestWithRetry(path)
  if (!result.ok) {
    pushResult("BLOCKED", area, item, formatNetworkDetail(result), path, { reason: result.reason })
    return
  }

  if (result.response.status >= 200 && result.response.status < 400) {
    pushResult("PASS", area, item, formatResponseDetail({ label: "Received status", res: result.response, elapsedMs: result.elapsedMs }), path)
    return
  }

  pushResult(
    "FAIL",
    area,
    item,
    formatResponseDetail({ label: "Expected public success, got", res: result.response, elapsedMs: result.elapsedMs }),
    path,
  )
}

const expectProtectedBlocked = async (path, area, item) => {
  const result = await requestWithRetry(path)
  if (!result.ok) {
    pushResult("BLOCKED", area, item, formatNetworkDetail(result), path, { reason: result.reason })
    return
  }

  const res = result.response
  if ([401, 403].includes(res.status) || (res.status >= 300 && res.status < 400 && isLoginRedirect(res))) {
    pushResult("PASS", area, item, formatResponseDetail({ label: "Protected route blocked with", res, elapsedMs: result.elapsedMs }), path)
    return
  }

  pushResult(
    "FAIL",
    area,
    item,
    formatResponseDetail({ label: "Expected blocked route, got", res, elapsedMs: result.elapsedMs }),
    path,
  )
}

const expectWithCookie = async ({ path, area, item, cookie, expectedStatuses, blockedStatuses }) => {
  if (!cookie) {
    pushResult("BLOCKED", area, item, "MISSING_COOKIE :: Cookie env for this role check was not provided", path, {
      reason: "MISSING_COOKIE",
    })
    return
  }

  const result = await requestWithRetry(path, {
    headers: {
      cookie,
    },
  })

  if (!result.ok) {
    pushResult("BLOCKED", area, item, formatNetworkDetail(result), path, { reason: result.reason })
    return
  }

  const res = result.response
  if (expectedStatuses?.includes(res.status)) {
    pushResult("PASS", area, item, formatResponseDetail({ label: "Received expected status", res, elapsedMs: result.elapsedMs }), path)
    return
  }

  if (blockedStatuses?.includes(res.status) || (blockedStatuses?.some((status) => status >= 300 && status < 400) && isLoginRedirect(res))) {
    pushResult("PASS", area, item, formatResponseDetail({ label: "Access correctly blocked with", res, elapsedMs: result.elapsedMs }), path)
    return
  }

  pushResult(
    "FAIL",
    area,
    item,
    `Unexpected status ${res.status} :: expected one of ${[...(expectedStatuses || []), ...(blockedStatuses || [])].join(", ")} :: elapsed=${formatElapsed(result.elapsedMs)}${debug ? ` :: finalUrl=${res.url || "unknown"}${getHeader(res, "location") ? ` :: location=${getHeader(res, "location")}` : ""}` : ""}`,
    path,
  )
}

const expectJsonWithCookie = async ({ path, area, item, cookie, validate }) => {
  if (!cookie) {
    pushResult("BLOCKED", area, item, "MISSING_COOKIE :: Cookie env for this role check was not provided", path, {
      reason: "MISSING_COOKIE",
    })
    return
  }

  const result = await requestWithRetry(path, {
    headers: {
      cookie,
    },
  })

  if (!result.ok) {
    pushResult("BLOCKED", area, item, formatNetworkDetail(result), path, { reason: result.reason })
    return
  }

  const res = result.response
  let payload = null
  try {
    payload = await res.json()
  } catch {
    pushResult("FAIL", area, item, `Expected JSON response :: status=${res.status} :: elapsed=${formatElapsed(result.elapsedMs)}`, path)
    return
  }

  if (!res.ok) {
    pushResult("FAIL", area, item, formatResponseDetail({ label: "Expected success JSON, got", res, elapsedMs: result.elapsedMs }), path)
    return
  }

  if (hasSensitiveLeak(payload)) {
    pushResult("FAIL", area, item, `Secret-like key detected in JSON payload :: status=${res.status} :: elapsed=${formatElapsed(result.elapsedMs)}`, path)
    return
  }

  const validation = validate(payload)
  if (!validation.ok) {
    pushResult("FAIL", area, item, `${validation.detail} :: elapsed=${formatElapsed(result.elapsedMs)}`, path)
    return
  }

  pushResult("PASS", area, item, `Validated JSON shape :: status=${res.status} :: elapsed=${formatElapsed(result.elapsedMs)}`, path)
}

const runWarmup = async () => {
  const warmup = await requestWithRetry("/")
  if (!warmup.ok) {
    pushResult("BLOCKED", "Warm-up", "Warm-up homepage reachability", formatNetworkDetail(warmup), "/", { reason: warmup.reason })
    return { reachedApp: false, result: warmup }
  }

  if (warmup.response.status >= 200 && warmup.response.status < 400) {
    pushResult("PASS", "Warm-up", "Warm-up homepage reachability", formatResponseDetail({ label: "Received status", res: warmup.response, elapsedMs: warmup.elapsedMs }), "/")
    return { reachedApp: true, result: warmup }
  }

  pushResult("FAIL", "Warm-up", "Warm-up homepage reachability", formatResponseDetail({ label: "Expected public success, got", res: warmup.response, elapsedMs: warmup.elapsedMs }), "/")
  return { reachedApp: true, result: warmup }
}

const run = async () => {
  pushResult("PASS", "Preflight", "BASE_URL provided", normalizedBaseUrl)
  pushResult(
    "PASS",
    "Preflight",
    "Smoke configuration",
    `timeout=${timeoutMs}ms :: retries=${retries} :: retryDelay=${retryDelayMs}ms :: debug=${debug ? "1" : "0"}`,
  )

  const warmup = await runWarmup()

  if (warmup.reachedApp) {
    await expectPublicOk("/", "Public routes", "Homepage loads")
    await expectPublicOk("/login", "Auth and access", "Login page loads")
    await expectPublicOk("/pricing", "Billing", "Pricing page loads")

    await expectProtectedBlocked("/dashboard", "Auth and access", "Logged-out dashboard access is blocked")
    await expectProtectedBlocked("/admin", "Auth and access", "Logged-out admin access is blocked")
    await expectProtectedBlocked("/admin/system", "Auth and access", "Logged-out founder system page access is blocked")
    await expectProtectedBlocked("/api/admin/orgs", "Admin and org boundary", "Logged-out admin org API access is blocked")
    await expectProtectedBlocked(
      "/api/admin/platform-status",
      "Admin and org boundary",
      "Logged-out platform status API access is blocked",
    )
    await expectProtectedBlocked(
      "/api/admin/launch-readiness",
      "Admin and org boundary",
      "Logged-out launch readiness API access is blocked",
    )
  } else {
    markBlockedByWarmup("/", "Public routes", "Homepage loads", warmup.result)
    markBlockedByWarmup("/login", "Auth and access", "Login page loads", warmup.result)
    markBlockedByWarmup("/pricing", "Billing", "Pricing page loads", warmup.result)
    markBlockedByWarmup("/dashboard", "Auth and access", "Logged-out dashboard access is blocked", warmup.result)
    markBlockedByWarmup("/admin", "Auth and access", "Logged-out admin access is blocked", warmup.result)
    markBlockedByWarmup("/admin/system", "Auth and access", "Logged-out founder system page access is blocked", warmup.result)
    markBlockedByWarmup("/api/admin/orgs", "Admin and org boundary", "Logged-out admin org API access is blocked", warmup.result)
    markBlockedByWarmup(
      "/api/admin/platform-status",
      "Admin and org boundary",
      "Logged-out platform status API access is blocked",
      warmup.result,
    )
    markBlockedByWarmup(
      "/api/admin/launch-readiness",
      "Admin and org boundary",
      "Logged-out launch readiness API access is blocked",
      warmup.result,
    )
  }

  if (warmup.reachedApp) {
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
    await expectJsonWithCookie({
      path: "/api/admin/platform-status",
      area: "Admin and org boundary",
      item: "Founder platform status API returns safe provider diagnostics",
      cookie: cookieEnv.founder,
      validate: (payload) => {
        if (!Array.isArray(payload?.providerDiagnostics)) {
          return { ok: false, detail: "providerDiagnostics array missing" }
        }
        if (!Array.isArray(payload?.securityAndAccess)) {
          return { ok: false, detail: "securityAndAccess array missing" }
        }
        return { ok: true }
      },
    })
    await expectJsonWithCookie({
      path: "/api/admin/launch-readiness",
      area: "Admin and org boundary",
      item: "Founder launch readiness API returns safe launch sections",
      cookie: cookieEnv.founder,
      validate: (payload) => {
        if (!Array.isArray(payload?.launchEvidence) || !Array.isArray(payload?.productModules)) {
          return { ok: false, detail: "launch readiness sections missing" }
        }
        return { ok: true }
      },
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
      path: "/api/admin/launch-readiness",
      area: "Admin and org boundary",
      item: "Org owner cannot access launch readiness API",
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
  } else {
    for (const roleCheck of [
      ["Founder can access admin root", "/admin"],
      ["Founder can access system page", "/admin/system"],
      ["Founder can access platform org API", "/api/admin/orgs"],
      ["Founder platform status API returns safe provider diagnostics", "/api/admin/platform-status"],
      ["Founder launch readiness API returns safe launch sections", "/api/admin/launch-readiness"],
      ["Org owner cannot access system page", "/admin/system"],
      ["Org owner cannot access platform org API", "/api/admin/orgs"],
      ["Org owner cannot access platform status API", "/api/admin/platform-status"],
      ["Org owner cannot access launch readiness API", "/api/admin/launch-readiness"],
      ["Org owner can access workspace users page", "/admin/users"],
    ]) {
      markBlockedByWarmup(roleCheck[1], "Admin and org boundary", roleCheck[0], warmup.result)
    }
  }

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
    "WARNING",
    "Environment validation",
    "Server-side env presence",
    "Provider configuration still needs manual review in the launch readiness centre; the smoke script checks only safe route behavior and response shape.",
  )
  pushResult(
    "WARNING",
    "Marketing",
    "Preview-only status",
    "Marketing remains preview-only and should stay clearly labeled during live validation.",
    "/dashboard/marketing",
  )
  pushResult(
    "WARNING",
    "Launch evidence",
    "Fresh live evidence still required",
    "Smoke pass alone is not launch approval. Invite, CRM, approvals, privacy locks, and backup evidence still need manual confirmation.",
  )

  let failed = 0
  let blocked = 0
  let warnings = 0

  for (const result of results) {
    if (result.status === "FAIL") failed += 1
    if (result.status === "BLOCKED") blocked += 1
    if (result.status === "WARNING") warnings += 1
    const routeSuffix = result.route ? ` [${result.route}]` : ""
    console.log(`${result.status} ${result.area} :: ${result.item}${routeSuffix} :: ${result.detail}`)
  }

  console.log("")
  console.log(`Summary: ${results.length} checks, ${failed} fail, ${blocked} blocked, ${warnings} warning`)

  if (failed > 0) {
    process.exit(1)
  }
}

run().catch((error) => {
  console.error("FAIL Smoke runner crashed:", error instanceof Error ? error.message : error)
  process.exit(1)
})
