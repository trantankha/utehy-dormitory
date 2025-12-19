// Validation schemas cho Room Management
import { z } from "zod"

export const createRoomSchema = z.object({
    dormitoryId: z.string().min(1, "Vui lòng chọn ký túc xá"),
    roomNumber: z.string().min(1, "Số phòng là bắt buộc").max(10, "Số phòng không được quá 10 ký tự"),
    floor: z.number().min(1, "Tầng phải >= 1").max(20, "Tầng không được quá 20"),
    roomType: z.enum(["PHONG_4", "PHONG_6", "PHONG_8"], { required_error: "Vui lòng chọn loại phòng" }),
    capacity: z.number().min(1, "Sức chứa phải >= 1").max(10, "Sức chứa không được quá 10"),
    pricePerSemester: z.number().min(0, "Giá thuê phải >= 0"),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
})

export const updateRoomSchema = z.object({
    roomNumber: z.string().min(1, "Số phòng là bắt buộc").max(10, "Số phòng không được quá 10 ký tự"),
    floor: z.number().min(1, "Tầng phải >= 1").max(20, "Tầng không được quá 20"),
    roomType: z.enum(["PHONG_4", "PHONG_6", "PHONG_8"], { required_error: "Vui lòng chọn loại phòng" }),
    capacity: z.number().min(1, "Sức chứa phải >= 1").max(10, "Sức chứa không được quá 10"),
    pricePerSemester: z.number().min(0, "Giá thuê phải >= 0"),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
})

export type CreateRoomInput = z.infer<typeof createRoomSchema>
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>
