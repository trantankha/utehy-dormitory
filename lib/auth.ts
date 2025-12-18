// Authentication Utilities
// Xử lý authentication và session management

import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import type { UserRole } from "@prisma/client"

export interface SessionUser {
  id: string
  email: string
  role: UserRole
  studentId?: string // Nếu là sinh viên
}

// Lấy thông tin user hiện tại từ session
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    // Parse session data (trong production nên dùng JWT hoặc session store)
    const sessionData = JSON.parse(sessionCookie.value) as SessionUser

    // Verify user still exists - only check if session data is valid, skip DB call for edge runtime
    // In production, consider using JWT or other session store that doesn't require DB calls in middleware
    return sessionData
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Kiểm tra quyền truy cập
export async function requireAuth(allowedRoles?: UserRole[]): Promise<SessionUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized: Please login")
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  return user
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Tạo session
export async function createSession(user: SessionUser): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set("session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  })
}

// Xóa session
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete({
    name: "session",
    path: "/",
  })
}

export const getSession = getCurrentUser
