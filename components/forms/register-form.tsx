"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { registerAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await registerAction(data)

      if (result.success) {
        // Redirect to student dashboard after successful registration
        router.push("/student/dashboard")
        router.refresh()
      } else {
        setError(result.error || "Đăng ký thất bại")
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi đăng ký")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Row 1: Email & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="student@utehy.edu.vn"
            {...register("email")}
            disabled={isLoading}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="studentCode">Mã sinh viên *</Label>
          <Input id="studentCode" type="text" placeholder="2024001" {...register("studentCode")} disabled={isLoading} />
          {errors.studentCode && <p className="text-sm text-red-600">{errors.studentCode.message}</p>}
        </div>
      </div>

      {/* Row 2: Passwords */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Mật khẩu *</Label>
          <Input id="password" type="password" placeholder="••••••••" {...register("password")} disabled={isLoading} />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu *</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
            disabled={isLoading}
          />
          {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {/* Row 3: Full Name & Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Họ và tên *</Label>
          <Input id="fullName" type="text" placeholder="Nguyễn Văn A" {...register("fullName")} disabled={isLoading} />
          {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Giới tính *</Label>
          <select
            id="gender"
            {...register("gender")}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
          {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
        </div>
      </div>

      {/* Row 4: Date of Birth & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
          <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} disabled={isLoading} />
          {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Số điện thoại *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="0987654321"
            {...register("phoneNumber")}
            disabled={isLoading}
          />
          {errors.phoneNumber && <p className="text-sm text-red-600">{errors.phoneNumber.message}</p>}
        </div>
      </div>

      {/* Row 5: Major & Course */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="major">Ngành học *</Label>
          <Input id="major" type="text" placeholder="Công nghệ thông tin" {...register("major")} disabled={isLoading} />
          {errors.major && <p className="text-sm text-red-600">{errors.major.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="course">Khóa học *</Label>
          <Input id="course" type="text" placeholder="K18" {...register("course")} disabled={isLoading} />
          {errors.course && <p className="text-sm text-red-600">{errors.course.message}</p>}
        </div>
      </div>

      {/* Row 6: Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Địa chỉ thường trú *</Label>
        <Input
          id="address"
          type="text"
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
          {...register("address")}
          disabled={isLoading}
        />
        {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang đăng ký...
          </>
        ) : (
          "Đăng ký"
        )}
      </Button>
    </form>
  )
}
