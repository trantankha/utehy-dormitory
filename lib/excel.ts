import * as XLSX from 'xlsx'

// ============================================
// EXCEL IMPORT/EXPORT UTILITIES
// ============================================

// Types for Excel data
export interface MeterReadingExcelRow {
    'Mã phòng': string
    'Tên phòng': string
    'Ký túc xá': string
    'Chỉ số điện': string
    'Chỉ số nước': string
    'Ghi chú'?: string
}

export interface UtilityBillExcelRow {
    'Mã phòng': string
    'Ký túc xá': string
    'Tiêu thụ điện (kWh)': number
    'Tiêu thụ nước (m³)': number
    'Tiền điện (VNĐ)': string
    'Tiền nước (VNĐ)': string
    'Tổng tiền (VNĐ)': string
    'Trạng thái': string
    'Hạn thanh toán': string
}

export interface StudentExcelRow {
    'Mã sinh viên': string
    'Họ tên': string
    'Giới tính': string
    'Ngày sinh': string
    'Số điện thoại': string
    'Email': string
    'Ngành học': string
    'Khóa học': string
    'Địa chỉ': string
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Export meter readings to Excel
 */
export function exportMeterReadingsToExcel(
    readings: any[],
    month: number,
    year: number
): Buffer {
    const data: MeterReadingExcelRow[] = readings.map(reading => ({
        'Mã phòng': reading.room.roomNumber,
        'Tên phòng': reading.room.roomNumber,
        'Ký túc xá': reading.room.dormitory.name,
        'Chỉ số điện': formatCurrency(Number(reading.electricityReading)),
        'Chỉ số nước': formatCurrency(Number(reading.waterReading)),
        'Ghi chú': reading.notes || '',
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()

    // Set column widths
    const colWidths = [
        { wch: 12 }, // Mã phòng
        { wch: 12 }, // Tên phòng
        { wch: 12 }, // Ký túc xá
        { wch: 15 }, // Chỉ số điện
        { wch: 15 }, // Chỉ số nước
        { wch: 20 }, // Ghi chú
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, `Chi so ${month}-${year}`)
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export utility bills to Excel
 */
export function exportUtilityBillsToExcel(
    bills: any[],
    month: number,
    year: number
): Buffer {
    const data: UtilityBillExcelRow[] = bills.map(bill => ({
        'Mã phòng': bill.room.roomNumber,
        'Ký túc xá': bill.room.dormitory.name,
        'Tiêu thụ điện (kWh)': bill.electricityUsage,
        'Tiêu thụ nước (m³)': bill.waterUsage,
        'Tiền điện (VNĐ)': formatCurrency(Number(bill.electricityAmount)),
        'Tiền nước (VNĐ)': formatCurrency(Number(bill.waterAmount)),
        'Tổng tiền (VNĐ)': formatCurrency(Number(bill.totalAmount)),
        'Trạng thái': getBillStatusText(bill.status),
        'Hạn thanh toán': bill.dueDate.toLocaleDateString('vi-VN'),
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()

    // Set column widths
    const colWidths = [
        { wch: 12 }, // Mã phòng
        { wch: 12 }, // Ký túc xá
        { wch: 12 }, // Tiêu thụ điện
        { wch: 12 }, // Tiêu thụ nước
        { wch: 15 }, // Tiền điện
        { wch: 15 }, // Tiền nước
        { wch: 17 }, // Tổng tiền
        { wch: 17 }, // Trạng thái
        { wch: 15 }, // Hạn thanh toán
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, `Hoa don ${month}-${year}`)
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

/**
 * Export students to Excel
 */
export function exportStudentsToExcel(students: any[]): Buffer {
    const data: StudentExcelRow[] = students.map(student => ({
        'Mã sinh viên': student.studentCode,
        'Họ tên': student.fullName,
        'Giới tính': student.gender === 'Nam' ? 'Nam' : 'Nữ',
        'Ngày sinh': student.dateOfBirth.toLocaleDateString('vi-VN'),
        'Số điện thoại': student.phoneNumber,
        'Email': student.email,
        'Ngành học': student.major,
        'Khóa học': student.course,
        'Địa chỉ': student.address,
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()

    // Set column widths
    const colWidths = [
        { wch: 15 }, // Mã sinh viên
        { wch: 25 }, // Họ tên
        { wch: 10 }, // Giới tính
        { wch: 12 }, // Ngày sinh
        { wch: 12 }, // Số điện thoại
        { wch: 18 }, // Email
        { wch: 20 }, // Ngành học
        { wch: 10 }, // Khóa học
        { wch: 30 }, // Địa chỉ
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sinh viên')
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

/**
 * Parse Excel file to meter readings data
 */
export function parseMeterReadingsFromExcel(buffer: Buffer): MeterReadingExcelRow[] {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(ws) as MeterReadingExcelRow[]

    return data
}

/**
 * Validate meter readings Excel data
 */
export function validateMeterReadingsExcelData(data: MeterReadingExcelRow[]): {
    valid: MeterReadingExcelRow[]
    errors: string[]
} {
    const errors: string[] = []
    const valid: MeterReadingExcelRow[] = []

    data.forEach((row, index) => {
        const rowNum = index + 2 // Excel row number (header is row 1)

        // Check required fields
        if (!row['Mã phòng']) {
            errors.push(`Dòng ${rowNum}: Thiếu mã phòng`)
            return
        }

        if (typeof row['Chỉ số điện'] !== 'number' || row['Chỉ số điện'] < 0) {
            errors.push(`Dòng ${rowNum}: Chỉ số điện không hợp lệ`)
            return
        }

        if (typeof row['Chỉ số nước'] !== 'number' || row['Chỉ số nước'] < 0) {
            errors.push(`Dòng ${rowNum}: Chỉ số nước không hợp lệ`)
            return
        }

        valid.push(row)
    })

    return { valid, errors }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get bill status text in Vietnamese
 */
function getBillStatusText(status: string): string {
    switch (status) {
        case 'PENDING':
            return 'Chờ thanh toán'
        case 'PAID':
            return 'Đã thanh toán'
        case 'OVERDUE':
            return 'Quá hạn'
        case 'CANCELLED':
            return 'Đã hủy'
        default:
            return status
    }
}

/**
 * Format currency for Excel
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount)
}

/**
 * Create Excel template for meter readings
 */
export function createMeterReadingsTemplate(): Buffer {
    const template: MeterReadingExcelRow[] = [
        {
            'Mã phòng': '101',
            'Tên phòng': '101',
            'Ký túc xá': 'Nhà A',
            'Chỉ số điện': '1500',
            'Chỉ số nước': '200',
            'Ghi chú': 'Ví dụ',
        },
        {
            'Mã phòng': '102',
            'Tên phòng': '102',
            'Ký túc xá': 'Nhà A',
            'Chỉ số điện': '1500',
            'Chỉ số nước': '200',
            'Ghi chú': 'Ví dụ',
        },
        {
            'Mã phòng': '103',
            'Tên phòng': '103',
            'Ký túc xá': 'Nhà B',
            'Chỉ số điện': '1600',
            'Chỉ số nước': '250',
            'Ghi chú': '',
        },
    ]

    const ws = XLSX.utils.json_to_sheet(template)
    const wb = XLSX.utils.book_new()

    // Set column widths
    const colWidths = [
        { wch: 12 }, // Mã phòng
        { wch: 12 }, // Tên phòng
        { wch: 15 }, // Ký túc xá
        { wch: 15 }, // Chỉ số điện
        { wch: 15 }, // Chỉ số nước
        { wch: 20 }, // Ghi chú
    ]
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Mẫu ghi chỉ số')
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
}
