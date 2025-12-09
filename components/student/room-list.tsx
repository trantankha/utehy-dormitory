"use client"

import { useEffect, useState } from "react"
import { getAvailableRoomsAction, getDormitoriesAction } from "@/actions/room"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoomRegistrationDialog } from "./room-registration-dialog"
import type { Room, Dormitory, Bed } from "@prisma/client"

type RoomWithRelations = Room & {
  dormitory: Dormitory
  beds: Bed[]
}

export function RoomList() {
  const [rooms, setRooms] = useState<RoomWithRelations[]>([])
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [selectedDormitory, setSelectedDormitory] = useState<string>("")
  const [selectedRoom, setSelectedRoom] = useState<RoomWithRelations | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDormitory])

  const loadData = async () => {
    setIsLoading(true)
    const [roomsResult, dormitoriesResult] = await Promise.all([
      getAvailableRoomsAction({ dormitoryId: selectedDormitory || undefined }),
      getDormitoriesAction(),
    ])

    if (roomsResult.success) {
      setRooms(roomsResult.data as RoomWithRelations[])
    }

    if (dormitoriesResult.success) {
      setDormitories(dormitoriesResult.data)
    }

    setIsLoading(false)
  }

  const handleRegister = (room: RoomWithRelations) => {
    setSelectedRoom(room)
    setIsDialogOpen(true)
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

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Ký túc xá</label>
              <select
                value={selectedDormitory}
                onChange={(e) => setSelectedDormitory(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer"
              >
                <option value="">Tất cả</option>
                {dormitories.map((dorm) => (
                  <option key={dorm.id} value={dorm.id}>
                    {dorm.name} ({dorm.gender === "NAM" ? "Nam" : "Nữ"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Cards */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Đang tải danh sách phòng...</p>
        </div>
      ) : rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Không có phòng trống</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Phòng {room.roomNumber}</CardTitle>
                    <CardDescription>{room.dormitory.name}</CardDescription>
                  </div>
                  <Badge variant={room.occupied < room.capacity ? "default" : "secondary"}>
                    {room.capacity - room.occupied} trống
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      {Number(room.pricePerSemester).toLocaleString("vi-VN")} đ/học kỳ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giường trống:</span>
                    <span className="font-medium">{room.beds.length} giường</span>
                  </div>
                </div>

                <Button
                  onClick={() => handleRegister(room)}
                  className="w-full cursor-pointer"
                  disabled={room.occupied >= room.capacity}
                >
                  {room.occupied >= room.capacity ? "Đã đầy" : "Đăng ký"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Registration Dialog */}
      {selectedRoom && (
        <RoomRegistrationDialog
          room={selectedRoom}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedRoom(null)
          }}
          onSuccess={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}
