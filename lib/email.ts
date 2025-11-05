import { Resend } from 'resend'

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Email template for utility bill notification
 */
export function createUtilityBillEmailTemplate(bill: any, student: any) {
    const dueDate = new Date(bill.dueDate).toLocaleDateString('vi-VN')
    const totalAmount = Number(bill.totalAmount).toLocaleString('vi-VN')

    return {
        subject: `Hóa đơn điện nước tháng ${bill.month}/${bill.year} - Phòng ${bill.room.roomNumber}`,
        html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Hóa đơn điện nước</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
                    .bill-details { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
                    .amount { font-size: 24px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }
                    .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 10px; border-radius: 4px; margin: 15px 0; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Ký túc xá Đại học Sư phạm Kỹ thuật Hưng Yên</h1>
                        <h2>Hóa đơn điện nước tháng ${bill.month}/${bill.year}</h2>
                    </div>

                    <div class="content">
                        <p>Kính chào <strong>${student.fullName}</strong>,</p>

                        <p>Hệ thống đã tạo hóa đơn điện nước cho phòng của bạn. Chi tiết như sau:</p>

                        <div class="bill-details">
                            <h3>Thông tin phòng:</h3>
                            <p><strong>Ký túc xá:</strong> ${bill.room.dormitory.name}</p>
                            <p><strong>Phòng:</strong> ${bill.room.roomNumber}</p>
                            <p><strong>Tháng:</strong> ${bill.month}/${bill.year}</p>
                        </div>

                        <div class="bill-details">
                            <h3>Chi tiết tiêu thụ:</h3>
                            <p><strong>Điện:</strong> ${bill.electricityUsage} kWh</p>
                            <p><strong>Nước:</strong> ${bill.waterUsage} m³</p>
                            <p><strong>Tiền điện:</strong> ${Number(bill.electricityAmount).toLocaleString('vi-VN')} đ</p>
                            <p><strong>Tiền nước:</strong> ${Number(bill.waterAmount).toLocaleString('vi-VN')} đ</p>
                        </div>

                        <div class="amount">
                            Tổng tiền: ${totalAmount} đ
                        </div>

                        <div class="warning">
                            <strong>Lưu ý:</strong> Hạn thanh toán đến ngày ${dueDate}.
                            Vui lòng thanh toán đúng hạn để tránh phí phạt.
                        </div>

                        <p>Để xem chi tiết và thanh toán hóa đơn, vui lòng đăng nhập vào hệ thống quản lý ký túc xá.</p>

                        <p>Trân trọng,<br>
                        Ban Quản lý Ký túc xá<br>
                        Đại học Sư phạm Kỹ thuật Hưng Yên</p>
                    </div>

                    <div class="footer">
                        <p>Email này được gửi tự động từ hệ thống. Vui lòng không trả lời email này.</p>
                        <p>&copy; 2024 Đại học Sư phạm Kỹ thuật Hưng Yên</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
Ký túc xá Đại học Sư phạm Kỹ thuật Hưng Yên

HÓA ĐƠN ĐIỆN NƯỚC THÁNG ${bill.month}/${bill.year}

Kính chào ${student.fullName},

Hệ thống đã tạo hóa đơn điện nước cho phòng của bạn.

THÔNG TIN PHÒNG:
- Ký túc xá: ${bill.room.dormitory.name}
- Phòng: ${bill.room.roomNumber}
- Tháng: ${bill.month}/${bill.year}

CHI TIẾT TIÊU THỤ:
- Điện: ${bill.electricityUsage} kWh
- Nước: ${bill.waterUsage} m³
- Tiền điện: ${Number(bill.electricityAmount).toLocaleString('vi-VN')} đ
- Tiền nước: ${Number(bill.waterAmount).toLocaleString('vi-VN')} đ

TỔNG TIỀN: ${totalAmount} đ

Hạn thanh toán: ${dueDate}

Để xem chi tiết và thanh toán hóa đơn, vui lòng đăng nhập vào hệ thống quản lý ký túc xá.

Trân trọng,
Ban Quản lý Ký túc xá
Đại học Sư phạm Kỹ thuật Hưng Yên
        `.trim(),
    }
}

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

/**
 * Send utility bill notification email
 */
export async function sendUtilityBillNotification(
    studentEmail: string,
    student: any,
    bill: any
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY not configured, skipping email send')
            return { success: true } // Don't fail the billing process
        }

        const template = createUtilityBillEmailTemplate(bill, student)

        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'UTEHY System <onboarding@resend.dev>',
            to: studentEmail,
            subject: template.subject,
            html: template.html,
            text: template.text,
        })

        if (error) {
            console.error('Failed to send utility bill email:', error)
            return { success: false, error: error.message }
        }

        console.log('Utility bill email sent successfully:', data)
        return { success: true }
    } catch (error: any) {
        console.error('Error sending utility bill email:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Send bulk utility bill notifications
 */
export async function sendBulkUtilityBillNotifications(
    bills: any[]
): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
    }

    for (const bill of bills) {
        try {
            // Get student info for the room
            const activeRegistration = await import('@/lib/prisma').then(({ prisma }) =>
                prisma.registration.findFirst({
                    where: {
                        roomId: bill.roomId,
                        status: {
                            in: ['DA_XAC_NHAN', 'DA_THANH_TOAN'],
                        },
                    },
                    include: {
                        student: true,
                    },
                })
            )

            if (!activeRegistration) {
                results.failed++
                results.errors.push(`Không tìm thấy sinh viên cho phòng ${bill.room.roomNumber}`)
                continue
            }

            const result = await sendUtilityBillNotification(
                activeRegistration.student.email,
                activeRegistration.student,
                bill
            )

            if (result.success) {
                results.success++
            } else {
                results.failed++
                results.errors.push(`Phòng ${bill.room.roomNumber}: ${result.error}`)
            }
        } catch (error: any) {
            results.failed++
            results.errors.push(`Phòng ${bill.room.roomNumber}: ${error.message}`)
        }
    }

    return results
}
