"use server"

// Server Actions cho Room Management
// Xử lý lấy danh sách phòng, chi tiết phòng

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { createRoomSchema, updateRoomSchema } from "@/lib/validations/room"
import { BedStatus } from "@prisma/client"

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
        beds: true,
      },
      orderBy: [{ dormitory: { name: "asc" } }, { roomNumber: "asc" }],
    })

    // Convert Decimal to number for client components
    const serializedRooms = rooms.map(room => ({
      ...room,
      pricePerSemester: Number(room.pricePerSemester),
      dormitory: { ...room.dormitory },
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
      dormitory: { ...room.dormitory },
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
    await requireAuth(["STUDENT", "ADMIN"])

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

// ============================================
// GET ALL ROOMS (Admin can view all rooms)
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
      dormitory: { ...room.dormitory },
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

// ============================================
// CREATE ROOM (Admin only)
// ============================================

export async function createRoomAction(data: any) {
  try {
    await requireAuth(["ADMIN"])

    // Validate input
    const validatedData = createRoomSchema.parse(data)

    // Check if room number already exists in the dormitory
    const existingRoom = await prisma.room.findFirst({
      where: {
        dormitoryId: validatedData.dormitoryId,
        roomNumber: validatedData.roomNumber,
      },
    })

    if (existingRoom) {
      return {
        success: false,
        error: "Số phòng đã tồn tại trong ký túc xá này",
      }
    }

    // Create room
    const room = await prisma.room.create({
      data: {
        ...validatedData,
        occupied: 0, // New room starts with 0 occupants
      },
      include: {
        dormitory: true,
        beds: true,
      },
    })

    // Create beds for the room (number of beds = capacity)
    const beds = []
    for (let i = 1; i <= validatedData.capacity; i++) {
      beds.push({
        roomId: room.id,
        bedNumber: i.toString(),
        status: BedStatus.AVAILABLE,
      })
    }
    await prisma.bed.createMany({
      data: beds,
    })

    // Convert Decimal to number for client components
    const serializedRoom = {
      ...room,
      pricePerSemester: Number(room.pricePerSemester),
      dormitory: { ...room.dormitory },
    }

    return {
      success: true,
      data: serializedRoom,
    }
  } catch (error) {
    console.error("Create room error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi tạo phòng",
    }
  }
}

// ============================================
// UPDATE ROOM (Admin only)
// ============================================

export async function updateRoomAction(roomId: string, data: any) {
  try {
    await requireAuth(["ADMIN"])

    // Validate input
    const validatedData = updateRoomSchema.parse(data)

    // Check if room exists
    const existingRoom = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!existingRoom) {
      return {
        success: false,
        error: "Không tìm thấy phòng",
      }
    }

    // Check if room number already exists in the dormitory (excluding current room)
    if (validatedData.roomNumber && validatedData.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await prisma.room.findFirst({
        where: {
          dormitoryId: existingRoom.dormitoryId,
          roomNumber: validatedData.roomNumber,
          id: { not: roomId },
        },
      })

      if (duplicateRoom) {
        return {
          success: false,
          error: "Số phòng đã tồn tại trong ký túc xá này",
        }
      }
    }

    // Update room
    const room = await prisma.room.update({
      where: { id: roomId },
      data: validatedData,
      include: {
        dormitory: true,
        beds: true,
      },
    })

    // Handle bed adjustments if capacity changed
    const currentBedCount = room.beds.length
    const newCapacity = validatedData.capacity

    if (newCapacity > currentBedCount) {
      // Add more beds
      const bedsToAdd = []
      for (let i = currentBedCount + 1; i <= newCapacity; i++) {
        bedsToAdd.push({
          roomId: roomId,
          bedNumber: i.toString(),
          status: BedStatus.AVAILABLE,
        })
      }
      await prisma.bed.createMany({
        data: bedsToAdd,
      })
    } else if (newCapacity < currentBedCount) {
      // Remove excess beds (only if they are available)
      const bedsToRemove = room.beds
        .filter(bed => bed.status === BedStatus.AVAILABLE)
        .slice(newCapacity) // Take beds beyond the new capacity

      if (bedsToRemove.length > 0) {
        await prisma.bed.deleteMany({
          where: {
            id: { in: bedsToRemove.map(bed => bed.id) },
          },
        })
      }
    }

    // Convert Decimal to number for client components
    const serializedRoom = {
      ...room,
      pricePerSemester: Number(room.pricePerSemester),
      dormitory: { ...room.dormitory },
    }

    return {
      success: true,
      data: serializedRoom,
    }
  } catch (error) {
    console.error("Update room error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi cập nhật phòng",
    }
  }
}

// ============================================
// DELETE ROOM (Admin only)
// ============================================

export async function deleteRoomAction(roomId: string) {
  try {
    await requireAuth(["ADMIN"])

    // Check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        beds: {
          include: {
            registrations: true,
          },
        },
      },
    })

    if (!room) {
      return {
        success: false,
        error: "Không tìm thấy phòng",
      }
    }

    // Check if room has active registrations
    const hasActiveRegistrations = room.beds.some(bed =>
      bed.registrations.some(reg => reg.status === "DA_XAC_NHAN")
    )

    if (hasActiveRegistrations) {
      return {
        success: false,
        error: "Không thể xóa phòng đang có sinh viên đăng ký",
      }
    }

    // Delete room (cascade will handle beds and related data)
    await prisma.room.delete({
      where: { id: roomId },
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error("Delete room error:", error)
    return {
      success: false,
      error: "Đã xảy ra lỗi khi xóa phòng",
    }
  }
}
