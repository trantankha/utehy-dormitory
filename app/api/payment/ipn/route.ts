// VNPay IPN (Instant Payment Notification) Handler
// Xử lý thông báo thanh toán từ VNPay server

import { NextRequest, NextResponse } from 'next/server'
import { verifyPaymentIPNAction } from '@/actions/payment'

export async function GET(request: NextRequest) {
    try {
        // Get search parameters from VNPay
        const searchParams = request.nextUrl.searchParams
        const params: Record<string, string> = {}

        // Convert URLSearchParams to plain object
        for (const [key, value] of searchParams.entries()) {
            params[key] = value
        }

        // Verify payment IPN
        const result = await verifyPaymentIPNAction(params)

        // Return response code to VNPay
        // VNPay expects a plain text response with the response code
        return new NextResponse(result.rspCode, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        })
    } catch (error) {
        console.error('Payment IPN error:', error)

        // Return error code to VNPay
        return new NextResponse('99', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        })
    }
}

export async function POST(request: NextRequest) {
    try {
        // VNPay can send IPN as POST request as well
        const body = await request.text()
        const params: Record<string, string> = {}

        // Parse query string format
        const searchParams = new URLSearchParams(body)
        for (const [key, value] of searchParams.entries()) {
            params[key] = value
        }

        // Verify payment IPN
        const result = await verifyPaymentIPNAction(params)

        // Return response code to VNPay
        return new NextResponse(result.rspCode, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        })
    } catch (error) {
        console.error('Payment IPN POST error:', error)

        // Return error code to VNPay
        return new NextResponse('99', {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
            },
        })
    }
}
