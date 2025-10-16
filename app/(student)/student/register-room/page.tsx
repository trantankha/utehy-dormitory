import { RoomList } from "@/components/student/room-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegisterRoomPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đăng ký phòng ký túc xá</h1>
        <p className="text-gray-600 mt-2">Chọn phòng phù hợp với bạn</p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn đăng ký</CardTitle>
          <CardDescription>Vui lòng đọc kỹ trước khi đăng ký</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Chọn ký túc xá phù hợp với giới tính của bạn</li>
            <li>Xem thông tin chi tiết phòng và giá thuê</li>
            <li>Chọn giường trống (nếu có)</li>
            <li>Điền thông tin đăng ký và gửi phiếu</li>
            <li>Chờ quản lý ký túc xá xác nhận</li>
            <li>Thanh toán sau khi được xác nhận</li>
          </ol>
        </CardContent>
      </Card>

      {/* Room List */}
      <RoomList />
    </div>
  )
}
