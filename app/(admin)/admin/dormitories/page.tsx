import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminDormitoriesPage() {
  const dormitories = await prisma.dormitory.findMany({
    include: {
      rooms: true,
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý ký túc xá</h1>
        <p className="text-gray-600 mt-2">Danh sách các ký túc xá</p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng số ký túc xá: {dormitories.length}</CardTitle>
        </CardHeader>
      </Card>

      {/* Dormitories List */}
      {dormitories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Chưa có ký túc xá nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dormitories.map((dormitory) => (
            <Card key={dormitory.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{dormitory.name}</h3>
                    <p className="text-sm text-gray-600">Mã: {dormitory.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={dormitory.isActive ? "default" : "secondary"}>
                      {dormitory.isActive ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                    <Badge className={dormitory.gender === "NAM" ? "bg-blue-600" : "bg-pink-600"}>
                      {dormitory.gender === "NAM" ? "Nam" : "Nữ"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tổng số phòng:</span>
                    <span className="font-medium">{dormitory.rooms.length} phòng</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phòng hoạt động:</span>
                    <span className="font-medium text-green-600">
                      {dormitory.rooms.filter((r) => r.isActive).length} phòng
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Địa chỉ</p>
                  <p className="text-sm mt-1">{dormitory.address}</p>
                </div>

                {dormitory.description && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600">Mô tả</p>
                    <p className="text-sm mt-1">{dormitory.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
