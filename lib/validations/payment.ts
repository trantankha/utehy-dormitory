// Payment Validation Schemas
// Zod schemas for payment-related data validation

import { z } from 'zod'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

// ============================================
// PAYMENT SCHEMAS
// ============================================

// Create Payment Schema
export const createPaymentSchema = z.object({
    registrationId: z.string().min(1, 'ID phiếu đăng ký là bắt buộc').optional(),
    utilityBillId: z.string().min(1, 'ID hóa đơn điện nước là bắt buộc').optional(),
    amount: z.number().min(1000, 'Số tiền tối thiểu là 1,000 VNĐ').max(50000000, 'Số tiền tối đa là 50,000,000 VNĐ'),
    method: z.nativeEnum(PaymentMethod),
    orderInfo: z.string().min(1, 'Thông tin đơn hàng là bắt buộc').max(255, 'Thông tin đơn hàng không được vượt quá 255 ký tự'),
    notes: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
}).refine((data) => data.registrationId || data.utilityBillId, {
    message: 'Phải có ít nhất một trong hai: registrationId hoặc utilityBillId',
    path: ['registrationId'], // This will show the error on registrationId field
})

// Update Payment Status Schema
export const updatePaymentStatusSchema = z.object({
    status: z.nativeEnum(PaymentStatus),
    transactionId: z.string().optional(),
    notes: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
})

// Refund Payment Schema
export const refundPaymentSchema = z.object({
    refundAmount: z.number().min(1000, 'Số tiền hoàn tối thiểu là 1,000 VNĐ'),
    refundReason: z.string().min(1, 'Lý do hoàn tiền là bắt buộc').max(500, 'Lý do hoàn tiền không được vượt quá 500 ký tự'),
    notes: z.string().max(1000, 'Ghi chú không được vượt quá 1000 ký tự').optional(),
})

// Payment Filter Schema
export const paymentFilterSchema = z.object({
    status: z.nativeEnum(PaymentStatus).optional(),
    method: z.nativeEnum(PaymentMethod).optional(),
    studentId: z.string().optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().max(50000000).optional(),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate payment amount
 */
export function validatePaymentAmount(amount: number): { isValid: boolean; error?: string } {
    if (amount < 1000) {
        return { isValid: false, error: 'Số tiền tối thiểu là 1,000 VNĐ' }
    }

    if (amount > 50000000) {
        return { isValid: false, error: 'Số tiền tối đa là 50,000,000 VNĐ' }
    }

    if (amount % 1000 !== 0) {
        return { isValid: false, error: 'Số tiền phải là bội số của 1,000 VNĐ' }
    }

    return { isValid: true }
}

/**
 * Validate refund amount
 */
export function validateRefundAmount(refundAmount: number, originalAmount: number): { isValid: boolean; error?: string } {
    if (refundAmount < 1000) {
        return { isValid: false, error: 'Số tiền hoàn tối thiểu là 1,000 VNĐ' }
    }

    if (refundAmount > originalAmount) {
        return { isValid: false, error: 'Số tiền hoàn không được vượt quá số tiền gốc' }
    }

    return { isValid: true }
}

/**
 * Validate payment method for VNPay
 */
export function validateVNPayMethod(method: PaymentMethod): { isValid: boolean; error?: string } {
    const vnpayMethods = ['VNPAY_QR', 'VNPAY_ATM', 'VNPAY_BANK']

    if (!vnpayMethods.includes(method)) {
        return { isValid: false, error: 'Phương thức thanh toán không hỗ trợ với VNPay' }
    }

    return { isValid: true }
}

/**
 * Validate order info
 */
export function validateOrderInfo(orderInfo: string): { isValid: boolean; error?: string } {
    if (!orderInfo || orderInfo.trim().length === 0) {
        return { isValid: false, error: 'Thông tin đơn hàng là bắt buộc' }
    }

    if (orderInfo.length > 255) {
        return { isValid: false, error: 'Thông tin đơn hàng không được vượt quá 255 ký tự' }
    }

    // Check for special characters that might cause issues
    const invalidChars = /[<>\"'&]/
    if (invalidChars.test(orderInfo)) {
        return { isValid: false, error: 'Thông tin đơn hàng chứa ký tự không hợp lệ' }
    }

    return { isValid: true }
}
