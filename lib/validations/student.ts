import { z } from "zod"

export const updateStudentProfileSchema = z.object({
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự").max(100, "Họ và tên không được vượt quá 100 ký tự"),
    gender: z.enum(["Nam", "Nữ"], {
        errorMap: () => ({ message: "Giới tính phải là 'Nam' hoặc 'Nữ'" })
    }),
    dateOfBirth: z.string().refine((date) => {
        const parsedDate = new Date(date)
        const now = new Date()
        const age = now.getFullYear() - parsedDate.getFullYear()
        return age >= 16 && age <= 30
    }, "Tuổi phải từ 16 đến 30"),
    phoneNumber: z.string().regex(/^(\+84|0)[3|5|7|8|9][0-9]{8}$/, "Số điện thoại không hợp lệ"),
    major: z.string().min(2, "Ngành học phải có ít nhất 2 ký tự").max(100, "Ngành học không được vượt quá 100 ký tự"),
    course: z.string().min(1, "Khóa học là bắt buộc").max(20, "Khóa học không được vượt quá 20 ký tự"),
    address: z.string().min(10, "Địa chỉ phải có ít nhất 10 ký tự").max(500, "Địa chỉ không được vượt quá 500 ký tự"),
})

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>
