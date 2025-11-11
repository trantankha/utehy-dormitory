import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function StudentDashboardPage() {
  const user = await requireAuth(["STUDENT"])

  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: user.studentId },
  })

  // Get active registrations
  const activeRegistrations = await prisma.registration.findMany({
    where: {
      studentId: user.studentId,
      status: {
        in: ["CHO_XAC_NHAN", "DA_XAC_NHAN", "DA_THANH_TOAN"],
      },
    },
    include: {
      room: {
        include: {
          dormitory: true,
        },
      },
    },
  })

  // Get transfer requests
  const transferRequests = await prisma.transferRequest.findMany({
    where: {
      studentId: user.studentId,
    },
    include: {
      currentRoom: {
        include: {
          dormitory: true,
        },
      },
      newRoom: {
        include: {
          dormitory: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3, // Show only recent 3
  })

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Xin chào, {student?.fullName}!</h1>
        <p className="text-gray-600 mt-2">Chào mừng bạn đến với hệ thống đăng ký ký túc xá UTEHY</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phiếu đăng ký</CardTitle>
            <CardDescription>Tổng số phiếu đang hoạt động</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeRegistrations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mã sinh viên</CardTitle>
            <CardDescription>Mã định danh của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{student?.studentCode}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Khóa học</CardTitle>
            <CardDescription>Khóa học hiện tại</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{student?.course}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>Các chức năng thường dùng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button asChild className="h-auto py-4 flex-col items-start">
              <Link href="/student/register-room">
                <span className="text-lg font-semibold">Đăng ký phòng mới</span>
                <span className="text-sm font-normal opacity-90">Tìm và đăng ký phòng ký túc xá</span>
              </Link>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start bg-transparent">
              <Link href="/student/my-registrations">
                <span className="text-lg font-semibold">Xem phiếu đăng ký</span>
                <span className="text-sm font-normal">Quản lý các phiếu đăng ký của bạn</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Registrations */}
      {activeRegistrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phiếu đăng ký đang hoạt động</CardTitle>
            <CardDescription>Danh sách các phiếu đăng ký hiện tại của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeRegistrations.map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">
                      {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Học kỳ: {registration.semester.replace(/_/g, " ")} • Trạng thái:{" "}
                      {registration.status === "CHO_XAC_NHAN" && "Chờ xác nhận"}
                      {registration.status === "DA_XAC_NHAN" && "Đã xác nhận"}
                      {registration.status === "DA_THANH_TOAN" && "Đã thanh toán"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/student/my-registrations">Chi tiết</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Requests */}
      {transferRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yêu cầu chuyển phòng gần đây</CardTitle>
            <CardDescription>Yêu cầu chuyển phòng của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transferRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">
                      {request.currentRoom.dormitory.name} → {request.newRoom.dormitory.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Phòng {request.currentRoom.roomNumber} → Phòng {request.newRoom.roomNumber}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(request.createdAt).toLocaleDateString("vi-VN")} •{" "}
                      {request.status === "CHO_XAC_NHAN" && "Chờ xác nhận"}
                      {request.status === "DA_DUYET" && "Đã duyệt"}
                      {request.status === "TU_CHOI" && "Từ chối"}
                      {request.status === "DA_HOAN_TAT" && "Đã hoàn tất"}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/student/transfer-room">Chi tiết</Link>
                  </Button>
                </div>
              ))}
            </div>
            {transferRequests.length > 3 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/student/transfer-room">Xem tất cả</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Thông tin sinh viên của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Họ và tên</p>
              <p className="font-medium">{student?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Giới tính</p>
              <p className="font-medium">{student?.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngành học</p>
              <p className="font-medium">{student?.major}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Số điện thoại</p>
              <p className="font-medium">{student?.phoneNumber}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
