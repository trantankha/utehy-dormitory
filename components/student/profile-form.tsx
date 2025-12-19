"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Edit, Save, X } from "lucide-react"
import { updateStudentProfileAction } from "@/actions/student"
import type { Student, User } from "@prisma/client"

type StudentWithUser = Student & {
    user: Pick<User, "email" | "createdAt">
}

interface ProfileFormProps {
    student: StudentWithUser
}

export function ProfileForm({ student }: ProfileFormProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [formData, setFormData] = useState({
        fullName: student.fullName,
        gender: student.gender as "Nam" | "Nữ",
        dateOfBirth: student.dateOfBirth.toISOString().split('T')[0], // Convert to YYYY-MM-DD
        phoneNumber: student.phoneNumber,
        major: student.major,
        course: student.course,
        address: student.address,
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            const result = await updateStudentProfileAction(formData)

            if (result.success) {
                setSuccess(true)
                setIsEditing(false)
                // Refresh the page to show updated data
                router.refresh()
            } else {
                setError(result.error || "Có lỗi xảy ra khi cập nhật thông tin")
            }
        } catch (err) {
            setError("Có lỗi xảy ra khi cập nhật thông tin")
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        // Reset form data to original values
        setFormData({
            fullName: student.fullName,
            gender: student.gender as "Nam" | "Nữ",
            dateOfBirth: student.dateOfBirth.toISOString().split('T')[0],
            phoneNumber: student.phoneNumber,
            major: student.major,
            course: student.course,
            address: student.address,
        })
        setIsEditing(false)
        setError(null)
        setSuccess(false)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Thông tin cá nhân</CardTitle>
                        <CardDescription>
                            {isEditing ? "Chỉnh sửa thông tin của bạn" : "Xem và chỉnh sửa thông tin cá nhân"}
                        </CardDescription>
                    </div>
                    {!isEditing && (
                        <Button onClick={() => setIsEditing(true)} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6">
                        <AlertDescription>Cập nhật thông tin thành công!</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="studentCode">Mã sinh viên</Label>
                            <Input
                                id="studentCode"
                                value={student.studentCode}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Không thể thay đổi</p>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={student.user.email}
                                disabled
                                className="bg-gray-50"
                            />
                            <p className="text-xs text-gray-500 mt-1">Không thể thay đổi</p>
                        </div>
                    </div>

                    {/* Editable fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label htmlFor="fullName">Họ và tên *</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleInputChange("fullName", e.target.value)}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="gender">Giới tính *</Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) => handleInputChange("gender", value)}
                                disabled={!isEditing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn giới tính" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Nam">Nam</SelectItem>
                                    <SelectItem value="Nữ">Nữ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="dateOfBirth">Ngày sinh *</Label>
                            <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="phoneNumber">Số điện thoại *</Label>
                            <Input
                                id="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                disabled={!isEditing}
                                placeholder="VD: 0987654321"
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="major">Ngành học *</Label>
                            <Input
                                id="major"
                                value={formData.major}
                                onChange={(e) => handleInputChange("major", e.target.value)}
                                disabled={!isEditing}
                                required
                            />
                        </div>

                        <div>
                            <Label htmlFor="course">Khóa học *</Label>
                            <Input
                                id="course"
                                value={formData.course}
                                onChange={(e) => handleInputChange("course", e.target.value)}
                                disabled={!isEditing}
                                placeholder="VD: K18, K19"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="address">Địa chỉ *</Label>
                        <Textarea
                            id="address"
                            value={formData.address}
                            onChange={(e) => handleInputChange("address", e.target.value)}
                            disabled={!isEditing}
                            rows={3}
                            placeholder="Nhập địa chỉ đầy đủ"
                            required
                        />
                    </div>

                    {/* Account info */}
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-medium mb-4">Thông tin tài khoản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label>Ngày tạo tài khoản</Label>
                                <Input
                                    value={new Date(student.user.createdAt).toLocaleDateString("vi-VN")}
                                    disabled
                                    className="bg-gray-50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {isEditing && (
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isLoading}
                                className="cursor-pointer"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading} className="cursor-pointer">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Đang lưu...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Lưu thay đổi
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </form>
            </CardContent>
        </Card>
    )
}
