import { StudentsManagement } from "@/components/admin/students-management"

export default function AdminStudentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý sinh viên</h1>
        <p className="text-gray-600 mt-2">Danh sách sinh viên đã đăng ký tài khoản</p>
      </div>

      {/* Students Management */}
      <StudentsManagement />
    </div>
  )
}
