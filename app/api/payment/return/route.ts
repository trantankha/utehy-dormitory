// VNPay Return URL Handler
// Xử lý khi người dùng quay lại từ VNPay

import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentReturnAction } from '@/actions/payment'

export async function GET(request: NextRequest) {
    try {
        // Get search parameters from VNPay
        const searchParams = request.nextUrl.searchParams
        const params: Record<string, string> = {}

        // Convert URLSearchParams to plain object
        for (const [key, value] of searchParams.entries()) {
            params[key] = value
        }

        // Verify payment return
        const result = await verifyPaymentReturnAction(params)

        if (result.success) {
            // Payment successful - redirect to success page
            const successUrl = new URL('/student/payment/success', request.url)
            successUrl.searchParams.set('paymentId', result.data?.payment.id!)
            return NextResponse.redirect(successUrl)
        } else {
            // Payment failed - redirect to failure page
            const failureUrl = new URL('/student/payment/failure', request.url)
            failureUrl.searchParams.set('error', result.error || 'Thanh toán thất bại')
            return NextResponse.redirect(failureUrl)
        }
    } catch (error) {
        console.error('Payment return error:', error)

        // Redirect to error page
        const errorUrl = new URL('/student/payment/error', request.url)
        return NextResponse.redirect(errorUrl)
    }
}
