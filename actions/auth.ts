"use server"

// Server Actions cho Authentication
// Xử lý login, register, logout

import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth"
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations/auth"
import { redirect } from "next/navigation"
import { UserRole } from "@prisma/client"

// ============================================
// LOGIN ACTION
// ============================================

export async function loginAction(data: LoginInput) {
  try {
    // 1. Validate input
    const validatedData = loginSchema.parse(data)

    // 2. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        student: true,
      },
    })

    if (!user) {
      return {
        success: false,
        error: "Email hoặc mật khẩu không đúng",
      }
    }

    // 3. Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: "Email hoặc mật khẩu không đúng",
      }
    }

    // 4. Create session
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student?.id,
    })

    // 5. Return success
    return {
      success: true,
      role: user.role,
    }
  } catch (error) {
    console.error("Login error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi đăng nhập",
    }
  }
}

// ============================================
// REGISTER ACTION (Student only)
// ============================================

export async function registerAction(data: RegisterInput) {
  try {
    // 1. Validate input
    const validatedData = registerSchema.parse(data)

    // 2. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return {
        success: false,
        error: "Email đã được sử dụng",
      }
    }

    // 3. Check if student code already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentCode: validatedData.studentCode },
    })

    if (existingStudent) {
      return {
        success: false,
        error: "Mã sinh viên đã được sử dụng",
      }
    }

    // 4. Hash password
    const hashedPassword = await hashPassword(validatedData.password)

    // 5. Create user and student in transaction
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        student: {
          create: {
            studentCode: validatedData.studentCode,
            fullName: validatedData.fullName,
            gender: validatedData.gender,
            dateOfBirth: new Date(validatedData.dateOfBirth),
            phoneNumber: validatedData.phoneNumber,
            email: validatedData.email,
            major: validatedData.major,
            course: validatedData.course,
            address: validatedData.address,
          },
        },
      },
      include: {
        student: true,
      },
    })

    // 6. Auto login after registration
    await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
      studentId: user.student!.id,
    })

    // 7. Return success
    return {
      success: true,
    }
  } catch (error) {
    console.error("Register error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi đăng ký",
    }
  }
}

// ============================================
// LOGOUT ACTION
// ============================================

export async function logoutAction() {
  await destroySession()
  redirect("/login")
}
