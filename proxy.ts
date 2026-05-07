import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { isAdmin, isSuperAdmin } from "@/lib/authz"

const PUBLIC_PAGE_ROUTES = new Set([
  "/",
  "/features",
  "/pricing",
  "/terms",
  "/trust",
  "/integrations",
  "/use-cases",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/privacy",
])

const PUBLIC_PAGE_PREFIXES = ["/portal/"]
const AUTH_PAGES = new Set(["/login", "/signup", "/forgot-password", "/reset-password"])
const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/portal/", "/api/invitations/", "/api/billing/webhook"]
const STATIC_PREFIXES = ["/_next/", "/images/", "/icons/"]
const STATIC_FILES = new Set([
  "/favicon.ico",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/apple-touch-icon.png",
  "/sw.js",
])

const isStaticAsset = (pathname: string) =>
  STATIC_FILES.has(pathname) ||
  STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
  /\.[a-zA-Z0-9]+$/.test(pathname)

const isPublicPage = (pathname: string) =>
  PUBLIC_PAGE_ROUTES.has(pathname) || PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const isPublicApi = (pathname: string) => PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))

const PROTECTED_PAGE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/crm",
  "/accounting",
  "/reports",
  "/tasks",
  "/ops",
  "/settings",
  "/billing",
  "/gallery",
  "/docs",
  "/ai",
]

const isProtectedPage = (pathname: string) => PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
const WORKSPACE_REQUIRED_ROUTE = "/workspace-required"

const buildLoginRedirect = (request: NextRequest) => {
  const loginUrl = new URL("/login", request.url)
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`
  loginUrl.searchParams.set("callbackUrl", callbackUrl)
  return NextResponse.redirect(loginUrl)
}

const buildAuthenticatedHome = (request: NextRequest, role?: string | null, orgId?: string | null) => {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl")
  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("/login") && !callbackUrl.startsWith("/signup")) {
    return NextResponse.redirect(new URL(callbackUrl, request.url))
  }
  if (!orgId && !isSuperAdmin(role)) {
    return NextResponse.redirect(new URL(WORKSPACE_REQUIRED_ROUTE, request.url))
  }
  return NextResponse.redirect(new URL(isAdmin(role) ? "/admin" : "/dashboard", request.url))
}

const jsonError = (message: string, status: number) =>
  NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  )

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isStaticAsset(pathname)) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const role = typeof token?.role === "string" ? token.role : null
  const orgId = typeof token?.orgId === "string" ? token.orgId : null

  if (AUTH_PAGES.has(pathname) && token) {
    return buildAuthenticatedHome(request, role, orgId)
  }

  if (pathname === WORKSPACE_REQUIRED_ROUTE) {
    if (!token) {
      return buildLoginRedirect(request)
    }
    if (orgId || isSuperAdmin(role)) {
      return NextResponse.redirect(new URL(isAdmin(role) ? "/admin" : "/dashboard", request.url))
    }
    return NextResponse.next()
  }

  if (pathname === "/dashboard/demo" && process.env.NODE_ENV !== "development") {
    return token ? NextResponse.redirect(new URL("/dashboard", request.url)) : buildLoginRedirect(request)
  }

  if (pathname === "/admin/system" && token && !isSuperAdmin(role)) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (pathname.startsWith("/api")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next()
    }

    if (!token) {
      return jsonError("Authentication required", 401)
    }

    if ((pathname.startsWith("/api/admin/orgs") || pathname.startsWith("/api/admin/platform-status")) && !isSuperAdmin(role)) {
      return jsonError("Super admin access required", 403)
    }

    if (
      (pathname.startsWith("/api/admin/") ||
        pathname === "/api/settings" ||
        pathname.startsWith("/api/audit") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/decision-trails/rollback") ||
        pathname.includes("/rollback")) &&
      !isAdmin(role)
    ) {
      return jsonError("Admin access required", 403)
    }

    return NextResponse.next()
  }

  if (isPublicPage(pathname)) {
    return NextResponse.next()
  }

  if (isProtectedPage(pathname)) {
    if (!token) {
      return buildLoginRedirect(request)
    }

    if (!orgId && !isSuperAdmin(role)) {
      return NextResponse.redirect(new URL(WORKSPACE_REQUIRED_ROUTE, request.url))
    }

    if (pathname.startsWith("/admin") && !isAdmin(role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
