"use server"

// Server Actions cho Registration Management
// Xử lý đăng ký phòng, hủy đăng ký, xem danh sách

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { registrationSchema, type RegistrationInput } from "@/lib/validations/registration"
import { revalidatePath } from "next/cache"
import { RegistrationStatus } from "@prisma/client"

// ============================================
// CREATE REGISTRATION (Student only)
// ============================================

export async function createRegistrationAction(data: RegistrationInput) {
  try {
    // 1. Require authentication and student role
    const user = await requireAuth(["STUDENT"])

    if (!user.studentId) {
      return {
        success: false,
        error: "Không tìm thấy thông tin sinh viên",
      }
    }

    // 2. Validate input
    const validatedData = registrationSchema.parse(data)

    // 3. Check if student already has a registration for this semester
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        studentId: user.studentId,
        semester: validatedData.semester,
        status: {
          in: ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN"],
        },
      },
    })

    if (existingRegistration) {
      return {
        success: false,
        error: "Bạn đã có phiếu đăng ký cho học kỳ này",
      }
    }

    // 4. Check room availability
    const room = await prisma.room.findUnique({
      where: { id: validatedData.roomId },
      include: {
        dormitory: true,
      },
    })

    if (!room) {
      return {
        success: false,
        error: "Phòng không tồn tại",
      }
    }

    if (!room.isActive) {
      return {
        success: false,
        error: "Phòng hiện không hoạt động",
      }
    }

    if (room.occupied >= room.capacity) {
      return {
        success: false,
        error: "Phòng đã đầy",
      }
    }

    // 5. Check gender compatibility
    const student = await prisma.student.findUnique({
      where: { id: user.studentId },
    })

    if (!student) {
      return {
        success: false,
        error: "Không tìm thấy thông tin sinh viên",
      }
    }

    const dormitoryGender = room.dormitory.gender === "NAM" ? "Nam" : "Nữ"
    if (student.gender !== dormitoryGender) {
      return {
        success: false,
        error: `Phòng này dành cho sinh viên ${dormitoryGender}`,
      }
    }

    // 6. If bedId is provided, check bed availability
    if (validatedData.bedId) {
      const bed = await prisma.bed.findUnique({
        where: { id: validatedData.bedId },
      })

      if (!bed || bed.roomId !== validatedData.roomId) {
        return {
          success: false,
          error: "Giường không hợp lệ",
        }
      }

      if (bed.status !== "AVAILABLE") {
        return {
          success: false,
          error: "Giường đã được đặt",
        }
      }
    }

    // 7. Create registration and update room/bed in transaction
    await prisma.$transaction(async (tx) => {
      // Create registration
      await tx.registration.create({
        data: {
          studentId: user.studentId!,
          roomId: validatedData.roomId,
          bedId: validatedData.bedId,
          semester: validatedData.semester,
          status: RegistrationStatus.CHO_XAC_NHAN,
          notes: validatedData.notes,
        },
      })

      // Update room occupied count
      await tx.room.update({
        where: { id: validatedData.roomId },
        data: {
          occupied: {
            increment: 1,
          },
        },
      })

      // Update bed status if bedId provided
      if (validatedData.bedId) {
        await tx.bed.update({
          where: { id: validatedData.bedId },
          data: {
            status: "RESERVED",
          },
        })
      }
    })

    // 8. Revalidate paths
    revalidatePath("/student/my-registrations")
    revalidatePath("/student/register-room")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Create registration error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi đăng ký phòng",
    }
  }
}

// ============================================
// CANCEL REGISTRATION (Student only)
// ============================================

export async function cancelRegistrationAction(registrationId: string) {
  try {
    // 1. Require authentication and student role
    const user = await requireAuth(["STUDENT"])

    // 2. Find registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        room: true,
        bed: true,
      },
    })

    if (!registration) {
      return {
        success: false,
        error: "Không tìm thấy phiếu đăng ký",
      }
    }

    // 3. Check ownership
    if (registration.studentId !== user.studentId) {
      return {
        success: false,
        error: "Bạn không có quyền hủy phiếu này",
      }
    }

    // 4. Check status - only allow cancel if CHO_XAC_NHAN
    if (registration.status !== "CHO_XAC_NHAN") {
      return {
        success: false,
        error: "Chỉ có thể hủy phiếu đang chờ xác nhận",
      }
    }

    // 5. Cancel registration and revert room/bed in transaction
    await prisma.$transaction(async (tx) => {
      // Update registration status
      await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: RegistrationStatus.DA_HUY,
          cancelledAt: new Date(),
        },
      })

      // Decrement room occupied count
      await tx.room.update({
        where: { id: registration.roomId },
        data: {
          occupied: {
            decrement: 1,
          },
        },
      })

      // Revert bed status if applicable
      if (registration.bedId) {
        await tx.bed.update({
          where: { id: registration.bedId },
          data: {
            status: "AVAILABLE",
          },
        })
      }
    })

    // 6. Revalidate paths
    revalidatePath("/student/my-registrations")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Cancel registration error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi hủy phiếu đăng ký",
    }
  }
}

// ============================================
// GET STUDENT REGISTRATIONS
// ============================================

export async function getStudentRegistrationsAction() {
  try {
    const user = await requireAuth(["STUDENT"])

    const registrations = await prisma.registration.findMany({
      where: {
        studentId: user.studentId,
      },
      include: {
        room: {
          include: {
            dormitory: true,
          },
        },
        bed: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      data: registrations,
    }
  } catch (error) {
    console.error("Get student registrations error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách đăng ký",
      data: [],
    }
  }
}
