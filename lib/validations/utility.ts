// Validation schemas cho Utility Management
import { z } from "zod"

export const utilityRateSchema = z.object({
    electricityRate: z.number().min(0, "Đơn giá điện phải >= 0"),
    waterRate: z.number().min(0, "Đơn giá nước phải >= 0"),
    effectiveFrom: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    description: z.string().optional(),
})

export const meterReadingSchema = z.object({
    roomId: z.string().min(1, "Phòng là bắt buộc"),
    month: z.number().min(1).max(12, "Tháng phải từ 1-12"),
    year: z.number().min(2020).max(2030, "Năm không hợp lệ"),
    electricityReading: z.number().min(0, "Chỉ số điện phải >= 0"),
    waterReading: z.number().min(0, "Chỉ số nước phải >= 0"),
    notes: z.string().optional(),
})

export const utilityBillSchema = z.object({
    roomId: z.string().min(1, "Phòng là bắt buộc"),
    month: z.number().min(1).max(12, "Tháng phải từ 1-12"),
    year: z.number().min(2020).max(2030, "Năm không hợp lệ"),
    dueDate: z.string().min(1, "Hạn thanh toán là bắt buộc"),
    notes: z.string().optional(),
})

export const updateBillStatusSchema = z.object({
    status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED"]),
    notes: z.string().optional(),
})

export type UtilityRateInput = z.infer<typeof utilityRateSchema>
export type MeterReadingInput = z.infer<typeof meterReadingSchema>
export type UtilityBillInput = z.infer<typeof utilityBillSchema>
export type UpdateBillStatusInput = z.infer<typeof updateBillStatusSchema>
