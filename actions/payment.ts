"use server"

// Server Actions cho Payment Management
// Xử lý thanh toán, xác nhận thanh toán, lịch sử thanh toán

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { createPaymentSchema, updatePaymentStatusSchema, refundPaymentSchema, type CreatePaymentInput, type UpdatePaymentStatusInput, type RefundPaymentInput } from "@/lib/validations/payment"
import { generateVNPayUrl, verifyVNPayReturn, verifyVNPayIPN, formatAmount, canRefundPayment, calculateRefundAmount } from "@/lib/payment"
import { revalidatePath } from "next/cache"
import { PaymentStatus, PaymentMethod } from "@prisma/client"

// ============================================
// CREATE PAYMENT (Student/Admin)
// ============================================

export async function createPaymentAction(data: CreatePaymentInput) {
    try {
        // Require authentication (can be student or admin)
        const user = await requireAuth()

        // Validate input
        const validatedData = createPaymentSchema.parse(data)

        // Check if registration exists and belongs to the student (if student)
        const registration = await prisma.registration.findUnique({
            where: { id: validatedData.registrationId },
            include: {
                student: true,
                room: {
                    include: {
                        dormitory: true,
                    },
                },
            },
        })

        if (!registration) {
            return {
                success: false,
                error: "Không tìm thấy phiếu đăng ký",
            }
        }

        // Check ownership if user is student
        if (user.role === 'STUDENT' && registration.studentId !== user.studentId) {
            return {
                success: false,
                error: "Bạn không có quyền thanh toán cho phiếu này",
            }
        }

        // Check if registration is in correct status for payment
        if (registration.status !== 'DA_XAC_NHAN') {
            return {
                success: false,
                error: "Phiếu đăng ký chưa được xác nhận hoặc đã thanh toán",
            }
        }

        // Check if payment already exists for this registration
        const existingPayment = await prisma.payment.findUnique({
            where: { registrationId: validatedData.registrationId },
        })

        if (existingPayment) {
            return {
                success: false,
                error: "Phiếu đăng ký đã có thanh toán",
            }
        }

        // Generate order ID (unique payment reference)
        const orderId = `PAY_${Date.now()}_${validatedData.registrationId?.slice(-8)}`

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                registrationId: validatedData.registrationId,
                studentId: registration.studentId,
                amount: validatedData.amount,
                method: validatedData.method,
                orderInfo: validatedData.orderInfo,
                notes: validatedData.notes,
                status: 'PENDING',
            },
        })

        // Generate VNPay URL if method is VNPay
        let paymentUrl: string | undefined
        if (validatedData.method !== 'CASH') {
            paymentUrl = generateVNPayUrl({
                amount: validatedData.amount,
                orderId,
                orderInfo: validatedData.orderInfo,
                ipAddr: '127.0.0.1', // In production, get from request
                method: validatedData.method,
            })
        }

        // Update payment with payment URL
        if (paymentUrl) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { paymentUrl },
            })
        }

        revalidatePath("/student/my-registrations")
        revalidatePath("/admin/registrations")

        return {
            success: true,
            data: {
                payment: {
                    ...payment,
                    amount: Number(payment.amount),
                    createdAt: payment.createdAt.toISOString(),
                    updatedAt: payment.updatedAt.toISOString(),
                },
                paymentUrl,
                orderId,
            },
        }
    } catch (error) {
        console.error("Create payment error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi tạo thanh toán",
        }
    }
}

// ============================================
// VERIFY PAYMENT RETURN (VNPay Return)
// ============================================

export async function verifyPaymentReturnAction(searchParams: Record<string, string>) {
    try {
        // Verify VNPay return data
        const verification = verifyVNPayReturn(searchParams)

        if (!verification.isValid || !verification.orderId) {
            return {
                success: false,
                error: "Dữ liệu thanh toán không hợp lệ",
            }
        }

        // Find payment by order ID (stored in orderInfo or separate field)
        // For now, we'll search by transaction ID or create a mapping
        const payment = await prisma.payment.findFirst({
            where: {
                orderInfo: {
                    contains: verification.orderId.split('_').pop() || '', // Extract ID from order ID
                },
                status: 'PENDING',
            },
            include: {
                registration: true,
                utilityBill: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!payment) {
            return {
                success: false,
                error: "Không tìm thấy thanh toán",
            }
        }

        // Update payment status
        const updateData: any = {
            status: verification.status,
            updatedAt: new Date(),
        }

        if (verification.transactionId) {
            updateData.transactionId = verification.transactionId
        }

        if (verification.status === 'COMPLETED') {
            updateData.paidAt = new Date()
        } else if (verification.status === 'CANCELLED') {
            updateData.cancelledAt = new Date()
        } else if (verification.status === 'FAILED') {
            updateData.failedAt = new Date()
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: updateData,
        })

        // If payment is successful, update related entity status
        if (verification.status === 'COMPLETED') {
            if (payment.registrationId) {
                // Update registration status
                await prisma.registration.update({
                    where: { id: payment.registrationId },
                    data: {
                        status: 'DA_THANH_TOAN',
                        paidAt: new Date(),
                    },
                })
            } else if (payment.utilityBillId) {
                // Update utility bill status
                await prisma.utilityBill.update({
                    where: { id: payment.utilityBillId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        paidBy: payment.student.user.email,
                    },
                })
            }
        }

        revalidatePath("/student/my-registrations")
        revalidatePath("/admin/registrations")

        return {
            success: true,
            data: {
                payment: {
                    ...payment,
                    amount: Number(payment.amount),
                    status: verification.status,
                },
                registration: payment.registration,
            },
        }
    } catch (error) {
        console.error("Verify payment return error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi xác nhận thanh toán",
        }
    }
}

// ============================================
// VERIFY PAYMENT IPN (VNPay IPN)
// ============================================

export async function verifyPaymentIPNAction(searchParams: Record<string, string>) {
    try {
        // Verify VNPay IPN data
        const verification = verifyVNPayIPN(searchParams)

        if (!verification.isValid || !verification.orderId) {
            return {
                rspCode: '97', // Checksum failed
            }
        }

        // Find payment by order ID
        const payment = await prisma.payment.findFirst({
            where: {
                orderInfo: {
                    contains: verification.orderId.split('_').pop() || '',
                },
                status: 'PENDING',
            },
            include: {
                registration: true,
                utilityBill: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!payment) {
            return {
                rspCode: '01', // Order not found
            }
        }

        // Update payment status
        const updateData: any = {
            status: verification.status,
            updatedAt: new Date(),
        }

        if (verification.transactionId) {
            updateData.transactionId = verification.transactionId
        }

        if (verification.status === 'COMPLETED') {
            updateData.paidAt = new Date()
        } else if (verification.status === 'CANCELLED') {
            updateData.cancelledAt = new Date()
        } else if (verification.status === 'FAILED') {
            updateData.failedAt = new Date()
        }

        await prisma.payment.update({
            where: { id: payment.id },
            data: updateData,
        })

        // If payment is successful, update related entity status
        if (verification.status === 'COMPLETED') {
            if (payment.registrationId) {
                // Update registration status
                await prisma.registration.update({
                    where: { id: payment.registrationId },
                    data: {
                        status: 'DA_THANH_TOAN',
                        paidAt: new Date(),
                    },
                })
            } else if (payment.utilityBillId) {
                // Update utility bill status
                await prisma.utilityBill.update({
                    where: { id: payment.utilityBillId },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        paidBy: payment.student.user.email,
                    },
                })
            }
        }

        return {
            rspCode: verification.rspCode,
        }
    } catch (error) {
        console.error("Verify payment IPN error:", error)
        return {
            rspCode: '99', // Unknown error
        }
    }
}

// ============================================
// GET PAYMENT HISTORY (Student/Admin)
// ============================================

export async function getPaymentHistoryAction(filters?: {
    status?: PaymentStatus
    method?: PaymentMethod
    dateFrom?: string
    dateTo?: string
}) {
    try {
        const user = await requireAuth()

        let whereClause: any = {}

        // If student, only show their payments
        if (user.role === 'STUDENT') {
            whereClause.studentId = user.studentId
        }

        // Apply filters
        if (filters?.status) {
            whereClause.status = filters.status
        }

        if (filters?.method) {
            whereClause.method = filters.method
        }

        if (filters?.dateFrom || filters?.dateTo) {
            whereClause.createdAt = {}
            if (filters.dateFrom) {
                whereClause.createdAt.gte = new Date(filters.dateFrom)
            }
            if (filters.dateTo) {
                whereClause.createdAt.lte = new Date(filters.dateTo)
            }
        }

        const payments = await prisma.payment.findMany({
            where: whereClause,
            include: {
                registration: {
                    include: {
                        room: {
                            include: {
                                dormitory: true,
                            },
                        },
                    },
                },
                utilityBill: {
                    include: {
                        room: {
                            include: {
                                dormitory: true,
                            },
                        },
                    },
                },
                student: {
                    include: {
                        user: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // Convert Decimal to number for client components
        const serializedPayments = payments.map(payment => ({
            ...payment,
            amount: Number(payment.amount),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            paidAt: payment.paidAt?.toISOString(),
            failedAt: payment.failedAt?.toISOString(),
            cancelledAt: payment.cancelledAt?.toISOString(),
            refundedAt: payment.refundedAt?.toISOString(),
            refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
        }))

        return {
            success: true,
            data: serializedPayments,
        }
    } catch (error) {
        console.error("Get payment history error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy lịch sử thanh toán",
            data: [],
        }
    }
}

// ============================================
// UPDATE PAYMENT STATUS (Admin only)
// ============================================

export async function updatePaymentStatusAction(paymentId: string, data: UpdatePaymentStatusInput) {
    try {
        await requireAuth(["ADMIN"])

        const validatedData = updatePaymentStatusSchema.parse(data)

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                registration: true,
                utilityBill: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!payment) {
            return {
                success: false,
                error: "Không tìm thấy thanh toán",
            }
        }

        const updateData: any = {
            status: validatedData.status,
            notes: validatedData.notes,
            updatedAt: new Date(),
        }

        if (validatedData.transactionId) {
            updateData.transactionId = validatedData.transactionId
        }

        if (validatedData.status === 'COMPLETED') {
            updateData.paidAt = new Date()
        } else if (validatedData.status === 'CANCELLED') {
            updateData.cancelledAt = new Date()
        } else if (validatedData.status === 'FAILED') {
            updateData.failedAt = new Date()
        }

        await prisma.payment.update({
            where: { id: paymentId },
            data: updateData,
        })

        // If payment is completed, update related entity status
        if (validatedData.status === 'COMPLETED') {
            if (payment.registration) {
                // Update registration status
                await prisma.registration.update({
                    where: { id: payment.registration.id },
                    data: {
                        status: 'DA_THANH_TOAN',
                        paidAt: new Date(),
                    },
                })
            } else if (payment.utilityBill) {
                // Update utility bill status
                await prisma.utilityBill.update({
                    where: { id: payment.utilityBill.id },
                    data: {
                        status: 'PAID',
                        paidAt: new Date(),
                        paidBy: payment.student.user.email,
                    },
                })
            }
        }

        revalidatePath("/admin/payments")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Update payment status error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi cập nhật trạng thái thanh toán",
        }
    }
}

// ============================================
// REFUND PAYMENT (Admin only)
// ============================================

export async function refundPaymentAction(paymentId: string, data: RefundPaymentInput) {
    try {
        await requireAuth(["ADMIN"])

        const validatedData = refundPaymentSchema.parse(data)

        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                registration: true,
                utilityBill: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        })

        if (!payment) {
            return {
                success: false,
                error: "Không tìm thấy thanh toán",
            }
        }

        // Check if payment can be refunded
        if (!canRefundPayment(payment.status)) {
            return {
                success: false,
                error: "Thanh toán này không thể hoàn tiền",
            }
        }

        // Validate refund amount
        if (validatedData.refundAmount > Number(payment.amount)) {
            return {
                success: false,
                error: "Số tiền hoàn không được vượt quá số tiền thanh toán",
            }
        }

        // Update payment with refund information
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'REFUNDED',
                refundedAt: new Date(),
                refundAmount: validatedData.refundAmount,
                refundReason: validatedData.refundReason,
                notes: validatedData.notes,
            },
        })

        // If registration was marked as paid, we might need to revert it
        // This depends on business rules - for now, we'll keep it as paid but add notes

        revalidatePath("/admin/payments")

        return {
            success: true,
        }
    } catch (error) {
        console.error("Refund payment error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi hoàn tiền",
        }
    }
}

// ============================================
// CREATE UTILITY BILL PAYMENT (Student/Admin)
// ============================================

export async function createUtilityBillPaymentAction(data: CreatePaymentInput) {
    try {
        // Require authentication (can be student or admin)
        const user = await requireAuth()

        // Validate input
        const validatedData = createPaymentSchema.parse(data)

        // Check if utility bill exists
        const utilityBill = await prisma.utilityBill.findUnique({
            where: { id: validatedData.utilityBillId! },
            include: {
                room: {
                    include: {
                        dormitory: true,
                        registrations: {
                            where: {
                                status: 'DA_THANH_TOAN', // Only active registrations
                            },
                            include: {
                                student: true,
                            },
                        },
                    },
                },
            },
        })

        if (!utilityBill) {
            return {
                success: false,
                error: "Không tìm thấy hóa đơn điện nước",
            }
        }

        // Check if bill is in correct status for payment
        if (utilityBill.status !== 'PENDING') {
            return {
                success: false,
                error: "Hóa đơn đã được thanh toán hoặc không thể thanh toán",
            }
        }

        // Check if payment already exists for this utility bill
        const existingPayment = await prisma.payment.findUnique({
            where: { utilityBillId: validatedData.utilityBillId },
        })

        if (existingPayment) {
            return {
                success: false,
                error: "Hóa đơn đã có thanh toán",
            }
        }

        // Determine student ID - for utility bills, we need to find the student(s) in the room
        // For simplicity, we'll use the first active student in the room
        const activeRegistration = utilityBill.room.registrations[0]
        if (!activeRegistration) {
            return {
                success: false,
                error: "Không tìm thấy sinh viên đang thuê phòng này",
            }
        }

        // Check ownership if user is student
        if (user.role === 'STUDENT' && activeRegistration.studentId !== user.studentId) {
            return {
                success: false,
                error: "Bạn không có quyền thanh toán cho hóa đơn này",
            }
        }

        // Generate order ID (unique payment reference)
        const orderId = `UTIL_${Date.now()}_${validatedData.utilityBillId!.slice(-8)}`

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                utilityBillId: validatedData.utilityBillId,
                studentId: activeRegistration.studentId,
                amount: validatedData.amount,
                method: validatedData.method,
                orderInfo: validatedData.orderInfo,
                notes: validatedData.notes,
                status: 'PENDING',
            },
        })

        // Generate VNPay URL if method is VNPay
        let paymentUrl: string | undefined
        if (validatedData.method !== 'CASH') {
            paymentUrl = generateVNPayUrl({
                amount: validatedData.amount,
                orderId,
                orderInfo: validatedData.orderInfo,
                ipAddr: '127.0.0.1', // In production, get from request
                method: validatedData.method,
            })
        }

        // Update payment with payment URL
        if (paymentUrl) {
            await prisma.payment.update({
                where: { id: payment.id },
                data: { paymentUrl },
            })
        }

        revalidatePath("/student/utility-bills")
        revalidatePath("/admin/utility-bills")

        return {
            success: true,
            data: {
                payment: {
                    ...payment,
                    amount: Number(payment.amount),
                    createdAt: payment.createdAt.toISOString(),
                    updatedAt: payment.updatedAt.toISOString(),
                },
                paymentUrl,
                orderId,
            },
        }
    } catch (error) {
        console.error("Create utility bill payment error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi tạo thanh toán hóa đơn điện nước",
        }
    }
}

// ============================================
// GET STUDENT PAYMENTS (Student only)
// ============================================

export async function getStudentPaymentsAction() {
    try {
        const user = await requireAuth(["STUDENT"])

        const payments = await prisma.payment.findMany({
            where: {
                studentId: user.studentId,
            },
            include: {
                registration: {
                    include: {
                        room: {
                            include: {
                                dormitory: true,
                            },
                        },
                    },
                },
                utilityBill: {
                    include: {
                        room: {
                            include: {
                                dormitory: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        // Convert Decimal to number for client components
        const serializedPayments = payments.map(payment => ({
            ...payment,
            amount: Number(payment.amount),
            createdAt: payment.createdAt.toISOString(),
            updatedAt: payment.updatedAt.toISOString(),
            paidAt: payment.paidAt?.toISOString(),
            failedAt: payment.failedAt?.toISOString(),
            cancelledAt: payment.cancelledAt?.toISOString(),
            refundedAt: payment.refundedAt?.toISOString(),
            refundAmount: payment.refundAmount ? Number(payment.refundAmount) : null,
        }))

        return {
            success: true,
            data: serializedPayments,
        }
    } catch (error) {
        console.error("Get student payments error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi lấy danh sách thanh toán",
            data: [],
        }
    }
}
