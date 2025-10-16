// Validation schemas cho Registration
import { z } from "zod"
import { Semester } from "@prisma/client"

export const registrationSchema = z.object({
  roomId: z.string().min(1, "Vui lòng chọn phòng"),
  bedId: z.string().optional(),
  semester: z.nativeEnum(Semester, { required_error: "Vui lòng chọn học kỳ" }),
  notes: z.string().optional(),
})

export const updateRegistrationStatusSchema = z.object({
  status: z.enum(["DA_XAC_NHAN", "DA_THANH_TOAN", "TU_CHOI"]),
  adminNotes: z.string().optional(),
})

export type RegistrationInput = z.infer<typeof registrationSchema>
export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusSchema>
