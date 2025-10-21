import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // Bỏ qua file tĩnh và tài nguyên public
  const isStaticAsset = pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico|css|js|woff|woff2|ttf|otf)$/);
  if (isStaticAsset) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/register"];
  if (publicRoutes.includes(pathname)) {
    if (session) {
      if (session.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (session.role === "STUDENT") {
        return NextResponse.redirect(new URL("/student/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes - require authentication
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin routes - only accessible by ADMIN role
  if (pathname.startsWith("/admin")) {
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
  }

  // Student routes - only accessible by STUDENT role
  if (pathname.startsWith("/student")) {
    if (session.role !== "STUDENT") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// Cấu hình matcher để loại trừ thêm các file tĩnh
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|utehy\\.png).*)",
  ],
};