import { RegistrationsManagement } from "@/components/admin/registrations-management"

export default function AdminRegistrationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phiếu đăng ký</h1>
        <p className="text-gray-600 mt-2">Xử lý các phiếu đăng ký ký túc xá</p>
      </div>

      {/* Registrations Management */}
      <RegistrationsManagement />
    </div>
  )
}
