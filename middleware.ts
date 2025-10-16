import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await getSession()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"]
  if (publicRoutes.includes(pathname)) {
    // If user is already logged in, redirect to their dashboard
    if (session) {
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      } else if (session.role === "STUDENT") {
        return NextResponse.redirect(new URL("/student/dashboard", request.url))
      }
    }
    return NextResponse.next()
  }

  // Protected routes - require authentication
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Admin routes - only accessible by ADMIN role
  if (pathname.startsWith("/admin")) {
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url))
    }
  }

  // Student routes - only accessible by STUDENT role
  if (pathname.startsWith("/student")) {
    if (session.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
