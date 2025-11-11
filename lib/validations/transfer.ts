// Validation schemas cho Transfer
import { z } from "zod"
import { Semester } from "@prisma/client"

export const transferRequestSchema = z.object({
    newRoomId: z.string().min(1, "Vui lòng chọn phòng mới"),
    newBedId: z.string().optional(),
    semester: z.nativeEnum(Semester, { required_error: "Vui lòng chọn học kỳ" }),
    reason: z.string().min(10, "Lý do phải có ít nhất 10 ký tự").max(500, "Lý do không được quá 500 ký tự"),
})

export const updateTransferStatusSchema = z.object({
    status: z.enum(["DA_DUYET", "TU_CHOI"]),
    adminNotes: z.string().optional(),
})

export type TransferRequestInput = z.infer<typeof transferRequestSchema>
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>
