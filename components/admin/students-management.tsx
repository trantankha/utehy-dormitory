"use client"

import { useEffect, useState } from "react"
import { getAllStudentsAction, deleteStudentAction } from "@/actions/admin"
import { exportStudentsExcelAction } from "@/actions/excel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Search, Trash2 } from "lucide-react"
import { paginate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import type { Student, User, Registration } from "@prisma/client"

type StudentWithRelations = Student & {
    user: Pick<User, "email" | "createdAt">
    registrations: Registration[]
}

export function StudentsManagement() {
    const [students, setStudents] = useState<StudentWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    useEffect(() => {
        loadStudents()
    }, [])

    const loadStudents = async () => {
        setIsLoading(true)
        const result = await getAllStudentsAction()

        if (result.success) {
            setStudents(result.data as StudentWithRelations[])
            setCurrentPage(1) // Reset to first page when data changes
        }

        setIsLoading(false)
    }

    const paginatedStudents = paginate(students, currentPage, 10)

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const handleSearch = async () => {
        setIsLoading(true)
        const result = await getAllStudentsAction(searchQuery.trim() || undefined)
        if (result.success) {
            setStudents(result.data as StudentWithRelations[])
            setCurrentPage(1) // Reset to first page when searching
        }
        setIsLoading(false)
    }

    const handleDelete = async (studentId: string) => {
        setIsDeleting(studentId)
        const result = await deleteStudentAction(studentId)
        if (result.success) {
            // Remove student from local state
            setStudents(prev => prev.filter(s => s.id !== studentId))
            alert("Đã xóa sinh viên thành công")
        } else {
            alert(`Lỗi: ${result.error}`)
        }
        setIsDeleting(null)
    }

    // Excel export function
    const handleExportExcel = async () => {
        const result = await exportStudentsExcelAction()

        if (result.success) {
            // Create download link
            const link = document.createElement('a')
            link.href = `data:${result.data?.mimeType};base64,${result.data?.buffer}`
            link.download = result.data!.fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            // Handle error - you might want to show a toast or alert
            console.error("Export failed:", result.error)
        }
    }

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-4">Đang tải danh sách...</p>
            </div>
        )
    }

    if (students.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <p className="text-gray-600">Chưa có sinh viên nào đăng ký</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Tổng số: {students.length} sinh viên</CardTitle>
                        <div className="flex items-center gap-4">
                            <Button className="cursor-pointer" onClick={handleExportExcel}>
                                <Upload className="mr-2 h-4 w-4" />
                                Xuất Excel
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search Bar */}
                    <div className="flex gap-2">
                        <Input
                            placeholder="Tìm kiếm theo tên, mã SV, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch} variant="outline" className="cursor-pointer">
                            <Search className="h-4 w-4 mr-2" />
                            Tìm kiếm
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                {paginatedStudents.data.map((student) => (
                    <Card key={student.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold">{student.fullName}</h3>
                                    <p className="text-sm text-gray-600">
                                        Mã SV: {student.studentCode} • {student.email}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge>{student.registrations.length} phiếu đăng ký</Badge>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={isDeleting === student.id || student.registrations.length > 0}
                                                className="cursor-pointer"
                                            >
                                                {isDeleting === student.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Xác nhận xóa sinh viên</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Bạn có chắc chắn muốn xóa sinh viên <strong>{student.fullName}</strong> (Mã SV: {student.studentCode})?
                                                    Hành động này không thể hoàn tác.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="cursor-pointer"
                                                    onClick={() => handleDelete(student.id)}
                                                >
                                                    Xóa
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-600">Giới tính</p>
                                    <p className="font-medium">{student.gender}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Ngày sinh</p>
                                    <p className="font-medium">{new Date(student.dateOfBirth).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Số điện thoại</p>
                                    <p className="font-medium">{student.phoneNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Ngành học</p>
                                    <p className="font-medium">{student.major}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Khóa học</p>
                                    <p className="font-medium">{student.course}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600">Ngày đăng ký TK</p>
                                    <p className="font-medium">{new Date(student.user.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-600">Địa chỉ</p>
                                <p className="text-sm mt-1">{student.address}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Pagination
                currentPage={paginatedStudents.currentPage}
                totalPages={paginatedStudents.totalPages}
                onPageChange={handlePageChange}
            />
        </div>
    )
}
