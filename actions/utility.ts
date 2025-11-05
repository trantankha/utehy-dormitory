"use server"

// Server Actions cho Utility Management
// Xử lý quản lý điện nước: ghi chỉ số, tính tiền, hóa đơn

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { utilityRateSchema, meterReadingSchema, updateBillStatusSchema, type UtilityRateInput, type MeterReadingInput, type UpdateBillStatusInput } from "@/lib/validations/utility"

// ============================================
// UTILITY RATES MANAGEMENT
// ============================================

// Lấy danh sách biểu giá hiện tại
export async function getCurrentUtilityRatesAction() {
    try {
        await requireAuth(["ADMIN"])

        const rates = await prisma.utilityRate.findMany({
            where: {
                effectiveTo: null, // Biểu giá hiện tại
            },
            orderBy: {
                effectiveFrom: "desc",
            },
        })

        return {
            success: true,
            data: rates.map(rate => ({
                ...rate,
                electricityRate: Number(rate.electricityRate),
                waterRate: Number(rate.waterRate),
            })),
        }
    } catch (error) {
        console.error("Get utility rates error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy biểu giá",
            data: [],
        }
    }
}

// Tạo biểu giá mới
export async function createUtilityRateAction(data: UtilityRateInput) {
    try {
        await requireAuth(["ADMIN"])

        const validatedData = utilityRateSchema.parse(data)

        // Kiểm tra không có biểu giá nào đang hiệu lực
        const existingRate = await prisma.utilityRate.findFirst({
            where: {
                effectiveTo: null,
            },
        })

        if (existingRate) {
            // Cập nhật effectiveTo của biểu giá cũ
            await prisma.utilityRate.update({
                where: { id: existingRate.id },
                data: {
                    effectiveTo: new Date(validatedData.effectiveFrom),
                },
            })
        }

        const rate = await prisma.utilityRate.create({
            data: {
                electricityRate: validatedData.electricityRate,
                waterRate: validatedData.waterRate,
                effectiveFrom: new Date(validatedData.effectiveFrom),
                description: validatedData.description,
            },
        })

        return {
            success: true,
            data: {
                ...rate,
                electricityRate: Number(rate.electricityRate),
                waterRate: Number(rate.waterRate),
            },
        }
    } catch (error) {
        console.error("Create utility rate error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi tạo biểu giá",
            data: null,
        }
    }
}

// ============================================
// METER READINGS MANAGEMENT
// ============================================

// Lấy danh sách ghi chỉ số theo tháng/năm
export async function getMeterReadingsAction(month: number, year: number) {
    try {
        await requireAuth(["ADMIN"])

        const readings = await prisma.meterReading.findMany({
            where: {
                month,
                year,
            },
            include: {
                room: {
                    include: {
                        dormitory: true,
                    },
                },
            },
            orderBy: [
                { room: { dormitory: { name: "asc" } } },
                { room: { roomNumber: "asc" } },
            ],
        })

        return {
            success: true,
            data: readings.map(reading => ({
                ...reading,
                room: {
                    ...reading.room,
                    pricePerSemester: Number(reading.room.pricePerSemester),
                    dormitory: { ...reading.room.dormitory },
                },
            })),
        }
    } catch (error) {
        console.error("Get meter readings error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy ghi chỉ số",
            data: [],
        }
    }
}

// Ghi chỉ số đồng hồ
export async function createMeterReadingAction(data: MeterReadingInput) {
    try {
        await requireAuth(["ADMIN"])

        const validatedData = meterReadingSchema.parse(data)
        const user = await requireAuth(["ADMIN"])

        // Kiểm tra phòng có tồn tại
        const room = await prisma.room.findUnique({
            where: { id: validatedData.roomId },
        })

        if (!room) {
            return {
                success: false,
                error: "Phòng không tồn tại",
                data: null,
            }
        }

        // Kiểm tra đã ghi chỉ số cho tháng này chưa
        const existingReading = await prisma.meterReading.findUnique({
            where: {
                roomId_month_year: {
                    roomId: validatedData.roomId,
                    month: validatedData.month,
                    year: validatedData.year,
                },
            },
        })

        if (existingReading) {
            return {
                success: false,
                error: "Đã ghi chỉ số cho phòng này trong tháng này",
                data: null,
            }
        }

        const reading = await prisma.meterReading.create({
            data: {
                roomId: validatedData.roomId,
                month: validatedData.month,
                year: validatedData.year,
                electricityReading: validatedData.electricityReading,
                waterReading: validatedData.waterReading,
                recordedBy: user.id,
                notes: validatedData.notes,
            },
            include: {
                room: {
                    include: {
                        dormitory: true,
                    },
                },
            },
        })

        return {
            success: true,
            data: {
                ...reading,
                room: {
                    ...reading.room,
                    pricePerSemester: Number(reading.room.pricePerSemester),
                    dormitory: { ...reading.room.dormitory },
                },
            },
        }
    } catch (error) {
        console.error("Create meter reading error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi ghi chỉ số",
            data: null,
        }
    }
}

// ============================================
// UTILITY BILLS MANAGEMENT
// ============================================

// Tính tiền điện nước cho tất cả phòng trong tháng
export async function calculateUtilityBillsAction(month: number, year: number) {
    try {
        await requireAuth(["ADMIN"])

        // Lấy biểu giá hiện tại
        const currentRate = await prisma.utilityRate.findFirst({
            where: {
                effectiveTo: null,
            },
        })

        if (!currentRate) {
            return {
                success: false,
                error: "Chưa có biểu giá điện nước",
                data: [],
            }
        }

        // Lấy tất cả phòng đang hoạt động
        const rooms = await prisma.room.findMany({
            where: {
                isActive: true,
            },
            include: {
                dormitory: true,
            },
        })

        const bills = []

        for (const room of rooms) {
            // Lấy chỉ số tháng hiện tại
            const currentReading = await prisma.meterReading.findUnique({
                where: {
                    roomId_month_year: {
                        roomId: room.id,
                        month,
                        year,
                    },
                },
            })

            if (!currentReading) {
                continue // Bỏ qua phòng chưa ghi chỉ số
            }

            // Kiểm tra đã có hóa đơn cho phòng này tháng này chưa
            const existingBill = await prisma.utilityBill.findUnique({
                where: {
                    roomId_month_year: {
                        roomId: room.id,
                        month,
                        year,
                    },
                },
            })

            if (existingBill) {
                console.log(`Bill already exists for room ${room.roomNumber} in ${month}/${year}, skipping...`)
                continue // Bỏ qua phòng đã có hóa đơn
            }

            // Lấy chỉ số tháng trước để tính tiêu thụ
            const prevMonth = month === 1 ? 12 : month - 1
            const prevYear = month === 1 ? year - 1 : year

            const prevReading = await prisma.meterReading.findUnique({
                where: {
                    roomId_month_year: {
                        roomId: room.id,
                        month: prevMonth,
                        year: prevYear,
                    },
                },
            })

            // Tính tiêu thụ
            const electricityUsage = currentReading.electricityReading - (prevReading?.electricityReading || 0)
            const waterUsage = currentReading.waterReading - (prevReading?.waterReading || 0)

            // Tính tiền
            const electricityAmount = electricityUsage * Number(currentRate.electricityRate)
            const waterAmount = waterUsage * Number(currentRate.waterRate)
            const totalAmount = electricityAmount + waterAmount

            // Tạo hóa đơn
            const bill = await prisma.utilityBill.create({
                data: {
                    roomId: room.id,
                    month,
                    year,
                    electricityUsage,
                    waterUsage,
                    electricityAmount,
                    waterAmount,
                    totalAmount,
                    dueDate: new Date(year, month, 10), // Hạn thanh toán ngày 10 tháng sau
                },
                include: {
                    room: {
                        include: {
                            dormitory: true,
                        },
                    },
                },
            })

            bills.push({
                ...bill,
                electricityAmount: Number(bill.electricityAmount),
                waterAmount: Number(bill.waterAmount),
                totalAmount: Number(bill.totalAmount),
                room: {
                    ...bill.room,
                    pricePerSemester: Number(bill.room.pricePerSemester),
                    dormitory: { ...bill.room.dormitory },
                },
            })
        }

        // Send email notifications to students
        if (bills.length > 0) {
            try {
                const { sendBulkUtilityBillNotifications } = await import("@/lib/email")
                const emailResults = await sendBulkUtilityBillNotifications(bills)

                console.log(`Email notifications sent: ${emailResults.success} success, ${emailResults.failed} failed`)
                if (emailResults.errors.length > 0) {
                    console.error("Email notification errors:", emailResults.errors)
                }
            } catch (emailError) {
                console.error("Failed to send email notifications:", emailError)
                // Don't fail the billing process if email fails
            }
        }

        return {
            success: true,
            data: bills,
        }
    } catch (error) {
        console.error("Calculate utility bills error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi tính tiền điện nước",
            data: [],
        }
    }
}

// Lấy danh sách hóa đơn theo tháng/năm
export async function getUtilityBillsAction(month: number, year: number) {
    try {
        await requireAuth(["ADMIN"])

        const bills = await prisma.utilityBill.findMany({
            where: {
                month,
                year,
            },
            include: {
                room: {
                    include: {
                        dormitory: true,
                    },
                },
            },
            orderBy: [
                { room: { dormitory: { name: "asc" } } },
                { room: { roomNumber: "asc" } },
            ],
        })

        return {
            success: true,
            data: bills.map(bill => ({
                ...bill,
                electricityAmount: Number(bill.electricityAmount),
                waterAmount: Number(bill.waterAmount),
                totalAmount: Number(bill.totalAmount),
                room: {
                    ...bill.room,
                    pricePerSemester: Number(bill.room.pricePerSemester),
                    dormitory: { ...bill.room.dormitory },
                },
            })),
        }
    } catch (error) {
        console.error("Get utility bills error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy hóa đơn",
            data: [],
        }
    }
}

// Cập nhật trạng thái hóa đơn
export async function updateUtilityBillStatusAction(billId: string, data: UpdateBillStatusInput) {
    try {
        await requireAuth(["ADMIN"])

        const validatedData = updateBillStatusSchema.parse(data)
        const user = await requireAuth(["ADMIN"])

        const bill = await prisma.utilityBill.findUnique({
            where: { id: billId },
        })

        if (!bill) {
            return {
                success: false,
                error: "Hóa đơn không tồn tại",
                data: null,
            }
        }

        const updateData: any = {
            status: validatedData.status,
            notes: validatedData.notes,
        }

        if (validatedData.status === "PAID") {
            updateData.paidAt = new Date()
            updateData.paidBy = user.id
        }

        const updatedBill = await prisma.utilityBill.update({
            where: { id: billId },
            data: updateData,
            include: {
                room: {
                    include: {
                        dormitory: true,
                    },
                },
            },
        })

        return {
            success: true,
            data: {
                ...updatedBill,
                electricityAmount: Number(updatedBill.electricityAmount),
                waterAmount: Number(updatedBill.waterAmount),
                totalAmount: Number(updatedBill.totalAmount),
                room: {
                    ...updatedBill.room,
                    pricePerSemester: Number(updatedBill.room.pricePerSemester),
                    dormitory: { ...updatedBill.room.dormitory },
                },
            },
        }
    } catch (error) {
        console.error("Update utility bill status error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi cập nhật hóa đơn",
            data: null,
        }
    }
}

// Lấy hóa đơn của sinh viên (theo phòng)
export async function getStudentUtilityBillsAction() {
    try {
        const user = await requireAuth(["STUDENT"])

        // Lấy thông tin sinh viên
        const student = await prisma.student.findUnique({
            where: { userId: user.id },
        })

        if (!student) {
            return {
                success: false,
                error: "Không tìm thấy thông tin sinh viên",
                data: [],
            }
        }

        // Lấy phiếu đăng ký đang hoạt động
        const activeRegistration = await prisma.registration.findFirst({
            where: {
                studentId: student.id,
                status: {
                    in: ["DA_XAC_NHAN", "DA_THANH_TOAN"],
                },
            },
            include: {
                room: true,
            },
        })

        if (!activeRegistration) {
            return {
                success: true,
                data: [],
            }
        }

        // Lấy hóa đơn của phòng
        const bills = await prisma.utilityBill.findMany({
            where: {
                roomId: activeRegistration.roomId,
            },
            orderBy: [
                { year: "desc" },
                { month: "desc" },
            ],
            take: 12, // Lấy 12 tháng gần nhất
        })

        return {
            success: true,
            data: bills.map(bill => ({
                ...bill,
                electricityAmount: Number(bill.electricityAmount),
                waterAmount: Number(bill.waterAmount),
                totalAmount: Number(bill.totalAmount),
            })),
        }
    } catch (error) {
        console.error("Get student utility bills error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy hóa đơn",
            data: [],
        }
    }
}
