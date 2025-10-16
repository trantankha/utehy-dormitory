// Validation schemas cho Authentication
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
})

export const registerSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
    studentCode: z.string().min(1, "Mã sinh viên là bắt buộc"),
    fullName: z.string().min(1, "Họ tên là bắt buộc"),
    gender: z.enum(["Nam", "Nữ"], { required_error: "Giới tính là bắt buộc" }),
    dateOfBirth: z.string().min(1, "Ngày sinh là bắt buộc"),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, "Số điện thoại phải có 10 chữ số"),
    major: z.string().min(1, "Ngành học là bắt buộc"),
    course: z.string().min(1, "Khóa học là bắt buộc"),
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
