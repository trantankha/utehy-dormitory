"use server"

// Server Actions cho Room Management
// Xử lý lấy danh sách phòng, chi tiết phòng

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

// ============================================
// GET AVAILABLE ROOMS (Student can view)
// ============================================

export async function getAvailableRoomsAction(filters?: {
  dormitoryId?: string
  gender?: "NAM" | "NU"
  roomType?: "PHONG_4" | "PHONG_6" | "PHONG_8"
}) {
  try {
    await requireAuth(["STUDENT"])

    const rooms = await prisma.room.findMany({
      where: {
        isActive: true,
        occupied: {
          lt: prisma.room.fields.capacity, // occupied < capacity
        },
        ...(filters?.dormitoryId && { dormitoryId: filters.dormitoryId }),
        ...(filters?.roomType && { roomType: filters.roomType }),
        ...(filters?.gender && {
          dormitory: {
            gender: filters.gender,
          },
        }),
      },
      include: {
        dormitory: true,
        beds: {
          where: {
            status: "AVAILABLE",
          },
        },
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
    console.error("Get available rooms error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách phòng",
      data: [],
    }
  }
}

// ============================================
// GET ROOM DETAILS
// ============================================

export async function getRoomDetailsAction(roomId: string) {
  try {
    await requireAuth(["STUDENT"])

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        dormitory: true,
        beds: {
          orderBy: {
            bedNumber: "asc",
          },
        },
      },
    })

    if (!room) {
      return {
        success: false,
        error: "Không tìm thấy phòng",
        data: null,
      }
    }

    // Convert Decimal to number for client components
    const serializedRoom = {
      ...room,
      pricePerSemester: Number(room.pricePerSemester),
    }

    return {
      success: true,
      data: serializedRoom,
    }
  } catch (error) {
    console.error("Get room details error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy thông tin phòng",
      data: null,
    }
  }
}

// ============================================
// GET DORMITORIES
// ============================================

export async function getDormitoriesAction() {
  try {
    await requireAuth(["STUDENT"])

    const dormitories = await prisma.dormitory.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return {
      success: true,
      data: dormitories,
    }
  } catch (error) {
    console.error("Get dormitories error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi lấy danh sách ký túc xá",
      data: [],
    }
  }
}
