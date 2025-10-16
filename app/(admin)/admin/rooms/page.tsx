import { RoomsManagement } from "@/components/admin/rooms-management"

export default function AdminRoomsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý phòng</h1>
        <p className="text-gray-600 mt-2">Danh sách phòng ký túc xá</p>
      </div>

      {/* Rooms Management */}
      <RoomsManagement />
    </div>
  )
}
