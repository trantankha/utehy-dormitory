import { MyRegistrationsList } from "@/components/student/my-registrations-list"

export default function MyRegistrationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Phiếu đăng ký của tôi</h1>
        <p className="text-gray-600 mt-2">Quản lý các phiếu đăng ký ký túc xá</p>
      </div>

      {/* Registrations List */}
      <MyRegistrationsList />
    </div>
  )
}
