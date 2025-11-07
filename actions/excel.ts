"use server"

// Server Actions cho Excel Import/Export
// Xử lý nhập xuất dữ liệu Excel cho hệ thống

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import {
    exportMeterReadingsToExcel,
    exportUtilityBillsToExcel,
    exportStudentsToExcel,
    parseMeterReadingsFromExcel,
    validateMeterReadingsExcelData,
    createMeterReadingsTemplate,
    type MeterReadingExcelRow
} from "@/lib/excel"

// ============================================
// EXPORT ACTIONS
// ============================================

/**
 * Export meter readings to Excel file
 */
export async function exportMeterReadingsExcelAction(month: number, year: number) {
    try {
        await requireAuth(["ADMIN"])

        // Get meter readings data
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

        if (readings.length === 0) {
            return {
                success: false,
                error: "Không có dữ liệu ghi chỉ số cho tháng này",
            }
        }

        // Generate Excel file
        const buffer = exportMeterReadingsToExcel(readings, month, year)
        const fileName = `ghi-chi-so-${month}-${year}.xlsx`

        return {
            success: true,
            data: {
                buffer: buffer.toString('base64'),
                fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        }
    } catch (error) {
        console.error("Export meter readings Excel error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi xuất Excel",
        }
    }
}

/**
 * Export utility bills to Excel file
 */
export async function exportUtilityBillsExcelAction(month: number, year: number) {
    try {
        await requireAuth(["ADMIN"])

        // Get utility bills data
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

        if (bills.length === 0) {
            return {
                success: false,
                error: "Không có dữ liệu hóa đơn cho tháng này",
            }
        }

        // Generate Excel file
        const buffer = exportUtilityBillsToExcel(bills, month, year)
        const fileName = `hoa-don-dien-nuoc-${month}-${year}.xlsx`

        return {
            success: true,
            data: {
                buffer: buffer.toString('base64'),
                fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        }
    } catch (error) {
        console.error("Export utility bills Excel error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi xuất Excel",
        }
    }
}

/**
 * Export students to Excel file
 */
export async function exportStudentsExcelAction() {
    try {
        await requireAuth(["ADMIN"])

        // Get students data
        const students = await prisma.student.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                    },
                },
            },
            orderBy: {
                studentCode: "asc",
            },
        })

        if (students.length === 0) {
            return {
                success: false,
                error: "Không có dữ liệu sinh viên",
            }
        }

        // Generate Excel file
        const buffer = exportStudentsToExcel(students)
        const fileName = `danh-sach-sinh-vien.xlsx`

        return {
            success: true,
            data: {
                buffer: buffer.toString('base64'),
                fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        }
    } catch (error) {
        console.error("Export students Excel error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi xuất Excel",
        }
    }
}

// ============================================
// IMPORT ACTIONS
// ============================================

/**
 * Import meter readings from Excel file
 */
export async function importMeterReadingsExcelAction(
    fileBuffer: string,
    month: number,
    year: number
) {
    try {
        await requireAuth(["ADMIN"])
        const user = await requireAuth(["ADMIN"])

        // Parse Excel file
        const buffer = Buffer.from(fileBuffer, 'base64')
        const rawData = parseMeterReadingsFromExcel(buffer)

        // Validate data
        const { valid: validData, errors } = validateMeterReadingsExcelData(rawData)

        if (errors.length > 0) {
            return {
                success: false,
                error: "Dữ liệu Excel không hợp lệ",
                details: errors,
            }
        }

        // Process import
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[],
        }

        for (const row of validData) {
            try {
                // Find room by room number
                const room = await prisma.room.findFirst({
                    where: {
                        roomNumber: row['Mã phòng'],
                        isActive: true,
                    },
                })

                if (!room) {
                    results.failed++
                    results.errors.push(`Phòng ${row['Mã phòng']} không tồn tại`)
                    continue
                }

                // Check if reading already exists
                const existingReading = await prisma.meterReading.findUnique({
                    where: {
                        roomId_month_year: {
                            roomId: room.id,
                            month,
                            year,
                        },
                    },
                })

                if (existingReading) {
                    results.failed++
                    results.errors.push(`Đã ghi chỉ số cho phòng ${row['Mã phòng']} tháng ${month}/${year}`)
                    continue
                }

                // Create meter reading
                await prisma.meterReading.create({
                    data: {
                        roomId: room.id,
                        month,
                        year,
                        electricityReading: Number(row['Chỉ số điện']),
                        waterReading: Number(row['Chỉ số nước']),
                        recordedBy: user.id,
                        notes: row['Ghi chú'] || null,
                    },
                })

                results.success++
            } catch (error: any) {
                results.failed++
                results.errors.push(`Lỗi xử lý phòng ${row['Mã phòng']}: ${error.message}`)
            }
        }

        return {
            success: true,
            data: results,
        }
    } catch (error) {
        console.error("Import meter readings Excel error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi nhập Excel",
        }
    }
}

/**
 * Download meter readings Excel template
 */
export async function downloadMeterReadingsTemplateAction() {
    try {
        await requireAuth(["ADMIN"])

        const buffer = createMeterReadingsTemplate()
        const fileName = 'mau-ghi-chi-so.xlsx'

        return {
            success: true,
            data: {
                buffer: buffer.toString('base64'),
                fileName,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        }
    } catch (error) {
        console.error("Download template error:", error)
        return {
            success: false,
            error: "Đã xảy ra lỗi khi tải mẫu",
        }
    }
}
