// Payment Integration Library
// VNPay integration for dormitory payment system

import crypto from 'crypto-js'
import moment from 'moment'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

// ============================================
// VNPAY CONFIGURATION
// ============================================

const VNPAY_CONFIG = {
    vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'your-tmn-code', // Terminal ID
    vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'your-secret-payment-key', // Secret key
    vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // VNPay URL
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payment/return', // Return URL
    vnp_IpnUrl: process.env.VNPAY_IPN_URL || 'http://localhost:3000/api/payment/ipn', // IPN URL
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
    vnp_OrderType: 'other', // Payment for dormitory registration
}

// ============================================
// PAYMENT UTILITIES
// ============================================

/**
 * Generate VNPay payment URL
 */
export function generateVNPayUrl(params: {
    amount: number
    orderId: string
    orderInfo: string
    ipAddr: string
    method?: PaymentMethod
}): string {
    // Prepare VNPay parameters
    const vnpParams: Record<string, string> = {
        vnp_Version: VNPAY_CONFIG.vnp_Version,
        vnp_Command: VNPAY_CONFIG.vnp_Command,
        vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
        vnp_Amount: (params.amount * 100).toString(),
        vnp_CurrCode: VNPAY_CONFIG.vnp_CurrCode,
        vnp_TxnRef: params.orderId,
        vnp_OrderInfo: params.orderInfo,
        vnp_OrderType: VNPAY_CONFIG.vnp_OrderType,
        vnp_Locale: VNPAY_CONFIG.vnp_Locale,
        vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
        vnp_IpAddr: params.ipAddr,
        vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
    }

    // Add payment method specific parameters
    if (params.method === 'VNPAY_QR') {
        vnpParams.vnp_BankCode = 'VNPAYQR'
    } else if (params.method === 'VNPAY_ATM') {
        vnpParams.vnp_BankCode = 'VNBANK'
    } else if (params.method === 'VNPAY_BANK') {
        vnpParams.vnp_BankCode = 'INTCARD'
    }

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(vnpParams).sort()

    // Generate secure hash on encoded values (VNPay standard)
    const signData = sortedKeys.map(key => `${key}=${encodeURIComponent(vnpParams[key])}`).join('&')
    const secureHash = crypto.HmacSHA512(signData, VNPAY_CONFIG.vnp_HashSecret).toString().toUpperCase()

    // Add secure hash to parameters
    vnpParams.vnp_SecureHash = secureHash

    // Build payment URL with encoded values
    const queryString = Object.keys(vnpParams)
        .sort() // Ensure consistent order
        .map(key => `${key}=${encodeURIComponent(vnpParams[key])}`)
        .join('&')

    return `${VNPAY_CONFIG.vnp_Url}?${queryString}`
}

/**
 * Verify VNPay return data
 */
export function verifyVNPayReturn(params: Record<string, string>): {
    isValid: boolean
    orderId?: string
    transactionId?: string
    amount?: number
    responseCode?: string
    status?: PaymentStatus
} {
    try {
        // Extract secure hash from params
        const { vnp_SecureHash, ...vnpParams } = params

        // Sort parameters alphabetically (exclude secure hash)
        const sortedKeys = Object.keys(vnpParams).sort()
        const signData = sortedKeys.map(key => `${key}=${encodeURIComponent(vnpParams[key])}`).join('&')

        // Generate expected secure hash
        const expectedHash = crypto.HmacSHA512(signData, VNPAY_CONFIG.vnp_HashSecret).toString().toUpperCase()

        // Verify hash
        if (expectedHash !== vnp_SecureHash) {
            console.log('Hash verification failed:', { expected: expectedHash, received: vnp_SecureHash })
            return { isValid: false }
        }

        // Extract payment information
        const orderId = vnpParams.vnp_TxnRef
        const transactionId = vnpParams.vnp_TransactionNo
        const amount = parseInt(vnpParams.vnp_Amount) / 100 // Convert back to VND
        const responseCode = vnpParams.vnp_ResponseCode

        // Determine payment status
        let status: PaymentStatus = 'FAILED'
        if (responseCode === '00') {
            status = 'COMPLETED'
        } else if (responseCode === '24') {
            status = 'CANCELLED'
        }

        return {
            isValid: true,
            orderId,
            transactionId,
            amount,
            responseCode,
            status,
        }
    } catch (error) {
        console.error('VNPay verification error:', error)
        return { isValid: false }
    }
}

/**
 * Verify VNPay IPN (Instant Payment Notification)
 */
export function verifyVNPayIPN(params: Record<string, string>): {
    isValid: boolean
    rspCode: string
    orderId?: string
    transactionId?: string
    amount?: number
    status?: PaymentStatus
} {
    try {
        // Extract secure hash from params
        const { vnp_SecureHash, ...vnpParams } = params

        // Sort parameters alphabetically (exclude secure hash)
        const sortedKeys = Object.keys(vnpParams).sort()
        const signData = sortedKeys.map(key => `${key}=${encodeURIComponent(vnpParams[key])}`).join('&')

        // Generate expected secure hash
        const expectedHash = crypto.HmacSHA512(signData, VNPAY_CONFIG.vnp_HashSecret).toString().toUpperCase()

        // Verify hash
        if (expectedHash !== vnp_SecureHash) {
            console.log('IPN Hash verification failed:', { expected: expectedHash, received: vnp_SecureHash })
            return { isValid: false, rspCode: '97' } // Checksum failed
        }

        // Extract payment information
        const orderId = vnpParams.vnp_TxnRef
        const transactionId = vnpParams.vnp_TransactionNo
        const amount = parseInt(vnpParams.vnp_Amount) / 100
        const responseCode = vnpParams.vnp_ResponseCode

        // Determine payment status and response code
        let status: PaymentStatus = 'FAILED'
        let rspCode = '01' // Unknown error

        if (responseCode === '00') {
            status = 'COMPLETED'
            rspCode = '00' // Success
        } else if (responseCode === '24') {
            status = 'CANCELLED'
            rspCode = '00' // Cancelled by user
        } else {
            rspCode = '01' // Payment failed
        }

        return {
            isValid: true,
            rspCode,
            orderId,
            transactionId,
            amount,
            status,
        }
    } catch (error) {
        console.error('VNPay IPN verification error:', error)
        return { isValid: false, rspCode: '99' } // Unknown error
    }
}

/**
 * Generate QR Code URL for VNPay
 */
export function generateQRCodeUrl(amount: number, orderId: string, orderInfo: string): string {
    const params = {
        amount,
        orderId,
        orderInfo,
        ipAddr: '127.0.0.1', // Default IP for QR code
        method: 'VNPAY_QR' as PaymentMethod,
    }

    return generateVNPayUrl(params)
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(method: PaymentMethod): string {
    const methodNames: Record<PaymentMethod, string> = {
        VNPAY_QR: 'VNPay QR Code',
        VNPAY_ATM: 'VNPay ATM',
        VNPAY_BANK: 'VNPay Internet Banking',
        CASH: 'Tiền mặt',
    }

    return methodNames[method] || method
}

/**
 * Get payment status display name
 */
export function getPaymentStatusName(status: PaymentStatus): string {
    const statusNames: Record<PaymentStatus, string> = {
        PENDING: 'Chờ thanh toán',
        PROCESSING: 'Đang xử lý',
        COMPLETED: 'Hoàn thành',
        FAILED: 'Thất bại',
        CANCELLED: 'Đã hủy',
        REFUNDED: 'Đã hoàn tiền',
    }

    return statusNames[status] || status
}

/**
 * Check if payment is successful
 */
export function isPaymentSuccessful(status: PaymentStatus): boolean {
    return status === 'COMPLETED'
}

/**
 * Check if payment can be refunded
 */
export function canRefundPayment(status: PaymentStatus): boolean {
    return status === 'COMPLETED'
}

/**
 * Calculate refund amount (with potential fees)
 */
export function calculateRefundAmount(originalAmount: number, refundPercentage: number = 100): number {
    return Math.round((originalAmount * refundPercentage) / 100)
}
