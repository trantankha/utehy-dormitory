"use client"

import { useEffect, useState } from "react"
import { getAllRoomsAction } from "@/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { paginate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import type { Room, Dormitory, Bed } from "@prisma/client"

type RoomWithRelations = Room & {
  dormitory: Dormitory
  beds: Bed[]
}

export function RoomsManagement() {
  const [rooms, setRooms] = useState<RoomWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    setIsLoading(true)
    const result = await getAllRoomsAction()

    if (result.success) {
      setRooms(result.data as RoomWithRelations[])
      setCurrentPage(1) // Reset to first page when data changes
    }

    setIsLoading(false)
  }

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case "PHONG_4":
        return "Phòng 4 người"
      case "PHONG_6":
        return "Phòng 6 người"
      case "PHONG_8":
        return "Phòng 8 người"
      default:
        return type
    }
  }

  const paginatedRooms = paginate(rooms, currentPage, 12)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-600 mt-4">Đang tải danh sách...</p>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Chưa có phòng nào</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tổng số phòng: {rooms.length}</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedRooms.data.map((room) => (
          <Card key={room.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Phòng {room.roomNumber}</h3>
                  <p className="text-sm text-gray-600">{room.dormitory.name}</p>
                </div>
                <Badge variant={room.isActive ? "default" : "secondary"}>
                  {room.isActive ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Loại phòng:</span>
                  <span className="font-medium">{getRoomTypeLabel(room.roomType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tầng:</span>
                  <span className="font-medium">Tầng {room.floor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sức chứa:</span>
                  <span className="font-medium">
                    {room.occupied}/{room.capacity} người
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá thuê:</span>
                  <span className="font-medium text-blue-600">
                    {Number(room.pricePerSemester).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số giường:</span>
                  <span className="font-medium">{room.beds.length} giường</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giường trống:</span>
                  <span className="font-medium text-green-600">
                    {room.beds.filter((b) => b.status === "AVAILABLE").length} giường
                  </span>
                </div>
              </div>

              {room.description && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600">{room.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination
        currentPage={paginatedRooms.currentPage}
        totalPages={paginatedRooms.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}
