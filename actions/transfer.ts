"use server"

// Server Actions cho Transfer Management
// Xử lý yêu cầu chuyển phòng, duyệt/từ chối transfer

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { transferRequestSchema, type TransferRequestInput } from "@/lib/validations/transfer"
import { revalidatePath } from "next/cache"
import { TransferStatus } from "@prisma/client"

// ============================================
// REQUEST ROOM TRANSFER (Student only)
// ============================================

export async function requestRoomTransferAction(data: TransferRequestInput) {
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
        const validatedData = transferRequestSchema.parse(data)

        // 3. Check if student has an active registration for this semester
        const currentRegistration = await prisma.registration.findFirst({
            where: {
                studentId: user.studentId,
                semester: validatedData.semester,
                status: {
                    in: ["DA_XAC_NHAN", "DA_THANH_TOAN"],
                },
            },
            include: {
                room: true,
                bed: true,
            },
        })

        if (!currentRegistration) {
            return {
                success: false,
                error: "Bạn không có phiếu đăng ký phòng nào học kỳ này",
            }
        }

        // 4. Check if student already has a pending transfer request
        const existingTransfer = await prisma.transferRequest.findFirst({
            where: {
                studentId: user.studentId,
                semester: validatedData.semester,
                status: {
                    in: ["CHO_XAC_NHAN", "DA_DUYET"],
                },
            },
        })

        if (existingTransfer) {
            return {
                success: false,
                error: "Bạn đã có yêu cầu chuyển phòng đang xử lý",
            }
        }

        // 5. Check new room availability
        const newRoom = await prisma.room.findUnique({
            where: { id: validatedData.newRoomId },
            include: {
                dormitory: true,
            },
        })

        if (!newRoom) {
            return {
                success: false,
                error: "Phòng mới không tồn tại",
            }
        }

        if (!newRoom.isActive) {
            return {
                success: false,
                error: "Phòng mới hiện không hoạt động",
            }
        }

        if (newRoom.occupied >= newRoom.capacity) {
            return {
                success: false,
                error: "Phòng mới đã đầy",
            }
        }

        // 6. Check gender compatibility
        const student = await prisma.student.findUnique({
            where: { id: user.studentId },
        })

        if (!student) {
            return {
                success: false,
                error: "Không tìm thấy thông tin sinh viên",
            }
        }

        const newDormitoryGender = newRoom.dormitory.gender === "NAM" ? "Nam" : "Nữ"
        if (student.gender !== newDormitoryGender) {
            return {
                success: false,
                error: `Phòng mới dành cho sinh viên ${newDormitoryGender}`,
            }
        }

        // 7. If new bed is specified, check bed availability
        if (validatedData.newBedId) {
            const newBed = await prisma.bed.findUnique({
                where: { id: validatedData.newBedId },
            })

            if (!newBed || newBed.roomId !== validatedData.newRoomId) {
                return {
                    success: false,
                    error: "Giường mới không hợp lệ",
                }
            }

            if (newBed.status !== "AVAILABLE") {
                return {
                    success: false,
                    error: "Giường mới đã được đặt",
                }
            }
        }

        // 8. Create transfer request
        await prisma.transferRequest.create({
            data: {
                studentId: user.studentId,
                currentRoomId: currentRegistration.roomId,
                newRoomId: validatedData.newRoomId,
                currentBedId: currentRegistration.bedId,
                newBedId: validatedData.newBedId,
                semester: validatedData.semester,
                reason: validatedData.reason,
                status: TransferStatus.CHO_XAC_NHAN,
            },
        })

        // 9. Revalidate paths
        revalidatePath("/student/my-registrations")
        revalidatePath("/student/transfer-room")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Request room transfer error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi gửi yêu cầu chuyển phòng",
        }
    }
}

// ============================================
// GET STUDENT TRANSFER REQUESTS
// ============================================

export async function getStudentTransferRequestsAction() {
    try {
        const user = await requireAuth(["STUDENT"])

        const transferRequests = await prisma.transferRequest.findMany({
            where: {
                studentId: user.studentId,
            },
            include: {
                currentRoom: {
                    include: {
                        dormitory: true,
                    },
                },
                newRoom: {
                    include: {
                        dormitory: true,
                    },
                },
                currentBed: true,
                newBed: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // Convert Decimal to number for client components
        const serializedRequests = transferRequests.map(request => ({
            ...request,
            currentRoom: {
                ...request.currentRoom,
                pricePerSemester: Number(request.currentRoom.pricePerSemester),
            },
            newRoom: {
                ...request.newRoom,
                pricePerSemester: Number(request.newRoom.pricePerSemester),
            },
        }))

        return {
            success: true,
            data: serializedRequests,
        }
    } catch (error) {
        console.error("Get student transfer requests error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy danh sách yêu cầu chuyển phòng",
            data: [],
        }
    }
}

// ============================================
// GET ALL TRANSFER REQUESTS (Admin only)
// ============================================

export async function getAllTransferRequestsAction(filters?: { status?: string; semester?: string }) {
    try {
        await requireAuth(["ADMIN"])

        const transferRequests = await prisma.transferRequest.findMany({
            where: {
                ...(filters?.status && { status: filters.status as TransferStatus }),
                ...(filters?.semester && { semester: filters.semester as any }),
            },
            include: {
                student: true,
                currentRoom: {
                    include: {
                        dormitory: true,
                    },
                },
                newRoom: {
                    include: {
                        dormitory: true,
                    },
                },
                currentBed: true,
                newBed: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // Convert Decimal to number for client components
        const serializedRequests = transferRequests.map(request => ({
            ...request,
            currentRoom: {
                ...request.currentRoom,
                pricePerSemester: Number(request.currentRoom.pricePerSemester),
            },
            newRoom: {
                ...request.newRoom,
                pricePerSemester: Number(request.newRoom.pricePerSemester),
            },
        }))

        return {
            success: true,
            data: serializedRequests,
        }
    } catch (error) {
        console.error("Get all transfer requests error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy danh sách yêu cầu chuyển phòng",
            data: [],
        }
    }
}

// ============================================
// APPROVE TRANSFER REQUEST (Admin only)
// ============================================

export async function approveTransferRequestAction(transferRequestId: string, adminNotes?: string) {
    try {
        await requireAuth(["ADMIN"])

        // Get transfer request
        const transferRequest = await prisma.transferRequest.findUnique({
            where: { id: transferRequestId },
            include: {
                student: true,
                currentRoom: true,
                newRoom: true,
                currentBed: true,
                newBed: true,
            },
        })

        if (!transferRequest) {
            return {
                success: false,
                error: "Không tìm thấy yêu cầu chuyển phòng",
            }
        }

        if (transferRequest.status !== "CHO_XAC_NHAN") {
            return {
                success: false,
                error: "Yêu cầu này không thể duyệt",
            }
        }

        // Check new room availability again
        const newRoom = await prisma.room.findUnique({
            where: { id: transferRequest.newRoomId },
        })

        if (!newRoom || newRoom.occupied >= newRoom.capacity) {
            return {
                success: false,
                error: "Phòng mới hiện không còn chỗ trống",
            }
        }

        // Check new bed availability if specified
        if (transferRequest.newBedId) {
            const newBed = await prisma.bed.findUnique({
                where: { id: transferRequest.newBedId },
            })

            if (!newBed || newBed.status !== "AVAILABLE") {
                return {
                    success: false,
                    error: "Giường mới hiện không còn trống",
                }
            }
        }

        // Execute transfer in transaction
        await prisma.$transaction(async (tx) => {
            // Update transfer request status
            await tx.transferRequest.update({
                where: { id: transferRequestId },
                data: {
                    status: TransferStatus.DA_DUYET,
                    approvedAt: new Date(),
                    adminNotes,
                },
            })

            // Update registration
            await tx.registration.updateMany({
                where: {
                    studentId: transferRequest.studentId,
                    semester: transferRequest.semester,
                    status: {
                        in: ["DA_XAC_NHAN", "DA_THANH_TOAN"],
                    },
                },
                data: {
                    roomId: transferRequest.newRoomId,
                    bedId: transferRequest.newBedId,
                },
            })

            // Update room occupancy
            await tx.room.update({
                where: { id: transferRequest.currentRoomId },
                data: {
                    occupied: {
                        decrement: 1,
                    },
                },
            })

            await tx.room.update({
                where: { id: transferRequest.newRoomId },
                data: {
                    occupied: {
                        increment: 1,
                    },
                },
            })

            // Update bed status
            if (transferRequest.currentBedId) {
                await tx.bed.update({
                    where: { id: transferRequest.currentBedId },
                    data: {
                        status: "AVAILABLE",
                    },
                })
            }

            if (transferRequest.newBedId) {
                await tx.bed.update({
                    where: { id: transferRequest.newBedId },
                    data: {
                        status: "OCCUPIED",
                    },
                })
            }
        })

        revalidatePath("/admin/transfer-requests")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Approve transfer request error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi duyệt yêu cầu chuyển phòng",
        }
    }
}

// ============================================
// REJECT TRANSFER REQUEST (Admin only)
// ============================================

export async function rejectTransferRequestAction(transferRequestId: string, adminNotes?: string) {
    try {
        await requireAuth(["ADMIN"])

        // Get transfer request
        const transferRequest = await prisma.transferRequest.findUnique({
            where: { id: transferRequestId },
        })

        if (!transferRequest) {
            return {
                success: false,
                error: "Không tìm thấy yêu cầu chuyển phòng",
            }
        }

        if (transferRequest.status !== "CHO_XAC_NHAN") {
            return {
                success: false,
                error: "Yêu cầu này không thể từ chối",
            }
        }

        // Update transfer request status
        await prisma.transferRequest.update({
            where: { id: transferRequestId },
            data: {
                status: TransferStatus.TU_CHOI,
                rejectedAt: new Date(),
                adminNotes,
            },
        })

        revalidatePath("/admin/transfer-requests")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Reject transfer request error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi từ chối yêu cầu chuyển phòng",
        }
    }
}

// ============================================
// COMPLETE TRANSFER REQUEST (Admin only)
// ============================================

export async function completeTransferRequestAction(transferRequestId: string) {
    try {
        await requireAuth(["ADMIN"])

        // Get transfer request
        const transferRequest = await prisma.transferRequest.findUnique({
            where: { id: transferRequestId },
        })

        if (!transferRequest) {
            return {
                success: false,
                error: "Không tìm thấy yêu cầu chuyển phòng",
            }
        }

        if (transferRequest.status !== "DA_DUYET") {
            return {
                success: false,
                error: "Yêu cầu này chưa được duyệt",
            }
        }

        // Update transfer request status
        await prisma.transferRequest.update({
            where: { id: transferRequestId },
            data: {
                status: TransferStatus.DA_HOAN_TAT,
                completedAt: new Date(),
            },
        })

        revalidatePath("/admin/transfer-requests")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Complete transfer request error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi hoàn tất chuyển phòng",
        }
    }
}
