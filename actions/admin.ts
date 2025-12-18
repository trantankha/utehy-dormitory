"use server"

// Server Actions cho Admin Management
// Xử lý quản lý registrations, rooms, dormitories

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { updateRegistrationStatusSchema, type UpdateRegistrationStatusInput } from "@/lib/validations/registration"
import { revalidatePath } from "next/cache"
import type { RegistrationStatus } from "@prisma/client"

// ============================================
// GET ALL REGISTRATIONS (Admin only)
// ============================================

export async function getAllRegistrationsAction(filters?: { status?: string; semester?: string }) {
  try {
    await requireAuth(["ADMIN"])

    const registrations = await prisma.registration.findMany({
      where: {
        ...(filters?.status && { status: filters.status as RegistrationStatus }),
        ...(filters?.semester && { semester: filters.semester as any }),
      },
      include: {
        student: true,
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

    // Convert Decimal to number for client components
    const serializedRegistrations = registrations.map(registration => ({
      ...registration,
      room: {
        ...registration.room,
        pricePerSemester: Number(registration.room.pricePerSemester),
      },
    }))

    return {
      success: true,
      data: serializedRegistrations,
    }
  } catch (error) {
    console.error("Get all registrations error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách đăng ký",
      data: [],
    }
  }
}

// ============================================
// UPDATE REGISTRATION STATUS (Admin only)
// ============================================

export async function updateRegistrationStatusAction(registrationId: string, data: UpdateRegistrationStatusInput) {
  try {
    await requireAuth(["ADMIN"])

    // Validate input
    const validatedData = updateRegistrationStatusSchema.parse(data)

    // Get current registration
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

    // Validate status transition
    const currentStatus = registration.status
    const newStatus = validatedData.status

    // Business rules for status transitions
    if (currentStatus === "DA_HUY" || currentStatus === "TU_CHOI") {
      return {
        success: false,
        error: "Không thể thay đổi trạng thái của phiếu đã hủy hoặc từ chối",
      }
    }

    // If rejecting, need to revert room/bed
    if (newStatus === "TU_CHOI") {
      await prisma.$transaction(async (tx) => {
        // Update registration
        await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: newStatus,
            adminNotes: validatedData.adminNotes,
          },
        })

        // Decrement room occupied
        await tx.room.update({
          where: { id: registration.roomId },
          data: {
            occupied: {
              decrement: 1,
            },
          },
        })

        // Revert bed status
        if (registration.bedId) {
          await tx.bed.update({
            where: { id: registration.bedId },
            data: {
              status: "AVAILABLE",
            },
          })
        }
      })
    } else {
      // Normal status update
      const updateData: any = {
        status: newStatus,
        adminNotes: validatedData.adminNotes,
      }

      if (newStatus === "DA_XAC_NHAN") {
        updateData.confirmedAt = new Date()
      } else if (newStatus === "DA_THANH_TOAN") {
        updateData.paidAt = new Date()
        if (!registration.confirmedAt) {
          updateData.confirmedAt = new Date()
        }
      }

      await prisma.registration.update({
        where: { id: registrationId },
        data: updateData,
      })
    }

    revalidatePath("/admin/registrations")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Update registration status error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi cập nhật trạng thái",
    }
  }
}

// ============================================
// GET DASHBOARD STATS (Admin only)
// ============================================

export async function getDashboardStatsAction() {
  try {
    await requireAuth(["ADMIN"])

    const [totalStudents, totalRooms, totalRegistrations, pendingRegistrations, totalDormitories] = await Promise.all([
      prisma.student.count(),
      prisma.room.count({ where: { isActive: true } }),
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "CHO_XAC_NHAN" } }),
      prisma.dormitory.count({ where: { isActive: true } }),
    ])

    // Get occupancy rate
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      select: {
        capacity: true,
        occupied: true,
      },
    })

    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0)
    const totalOccupied = rooms.reduce((sum, room) => sum + room.occupied, 0)
    const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0

    return {
      success: true,
      data: {
        totalStudents,
        totalRooms,
        totalRegistrations,
        pendingRegistrations,
        totalDormitories,
        occupancyRate,
        totalCapacity,
        totalOccupied,
      },
    }
  } catch (error) {
    console.error("Get dashboard stats error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy thống kê",
      data: null,
    }
  }
}

// ============================================
// GET ALL STUDENTS (Admin only)
// ============================================

export async function getAllStudentsAction(search?: string) {
  try {
    await requireAuth(["ADMIN"])

    const students = await prisma.student.findMany({
      where: search ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { studentCode: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      } : {},
      include: {
        user: {
          select: {
            email: true,
            createdAt: true,
          },
        },
        registrations: {
          where: {
            status: {
              in: ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN"],
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return {
      success: true,
      data: students,
    }
  } catch (error) {
    console.error("Get all students error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách sinh viên",
      data: [],
    }
  }
}

// ============================================
// DELETE STUDENT (Admin only)
// ============================================

export async function deleteStudentAction(studentId: string) {
  try {
    await requireAuth(["ADMIN"])

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        registrations: {
          where: {
            status: {
              in: ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN"],
            },
          },
        },
      },
    })

    if (!student) {
      return {
        success: false,
        error: "Không tìm thấy sinh viên",
      }
    }

    // Check if student has active registrations
    if (student.registrations.length > 0) {
      return {
        success: false,
        error: "Không thể xóa sinh viên có phiếu đăng ký đang hoạt động",
      }
    }

    // Delete student (cascade will delete user)
    await prisma.student.delete({
      where: { id: studentId },
    })

    revalidatePath("/admin/students")

    return {
      success: true,
    }
  } catch (error) {
    console.error("Delete student error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi xóa sinh viên",
    }
  }
}

// ============================================
// GET ALL ROOMS (Admin only)
// ============================================

export async function getAllRoomsAction() {
  try {
    await requireAuth(["ADMIN"])

    const rooms = await prisma.room.findMany({
      include: {
        dormitory: true,
        beds: true,
      },
      orderBy: [{ dormitory: { name: "asc" } }, { roomNumber: "asc" }],
    })

    // Convert Decimal to number for client components
    const serializedRooms = rooms.map(room => ({
      ...room,
      pricePerSemester: Number(room.pricePerSemester),
    }))

    return {
      success: true,
      data: serializedRooms,
    }
  } catch (error) {
    console.error("Get all rooms error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách phòng",
      data: [],
    }
  }
}
