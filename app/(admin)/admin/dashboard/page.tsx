import { getDashboardStatsAction, getAllRegistrationsAction } from "@/actions/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminDashboardPage() {
  const [statsResult, recentRegistrationsResult] = await Promise.all([
    getDashboardStatsAction(),
    getAllRegistrationsAction(),
  ])

  const stats = statsResult.data
  const recentRegistrations = recentRegistrationsResult.data.slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan hệ thống</h1>
        <p className="text-gray-600 mt-2">Thống kê và hoạt động gần đây</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng sinh viên</CardTitle>
            <CardDescription>Đã đăng ký tài khoản</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats?.totalStudents || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phiếu chờ duyệt</CardTitle>
            <CardDescription>Cần xử lý</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingRegistrations || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tổng phòng</CardTitle>
            <CardDescription>Đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats?.totalRooms || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tỷ lệ lấp đầy</CardTitle>
            <CardDescription>
              {stats?.totalOccupied || 0}/{stats?.totalCapacity || 0} giường
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{stats?.occupancyRate || 0}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Phiếu đăng ký gần đây</CardTitle>
          <CardDescription>5 phiếu đăng ký mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRegistrations.length === 0 ? (
            <p className="text-gray-600 text-center py-8">Chưa có phiếu đăng ký nào</p>
          ) : (
            <div className="space-y-4">
              {recentRegistrations.map((registration: any) => (
                <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-semibold">{registration.student.fullName}</p>
                    <p className="text-sm text-gray-600">
                      {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(registration.registeredAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div>
                    {registration.status === "CHO_XAC_NHAN" && <Badge variant="secondary">Chờ xác nhận</Badge>}
                    {registration.status === "DA_XAC_NHAN" && <Badge className="bg-blue-600">Đã xác nhận</Badge>}
                    {registration.status === "DA_THANH_TOAN" && <Badge className="bg-green-600">Đã thanh toán</Badge>}
                    {registration.status === "DA_HUY" && <Badge variant="destructive">Đã hủy</Badge>}
                    {registration.status === "TU_CHOI" && <Badge variant="destructive">Từ chối</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ký túc xá</CardTitle>
            <CardDescription>Tổng số ký túc xá đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalDormitories || 0} ký túc xá</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng phiếu đăng ký</CardTitle>
            <CardDescription>Tất cả phiếu đăng ký trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRegistrations || 0} phiếu</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
