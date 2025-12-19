"use client"

import { useEffect, useState } from "react"
import { getAllRoomsAction, createRoomAction, updateRoomAction, deleteRoomAction } from "@/actions/room"
import { getDormitoriesAction } from "@/actions/room"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react"
import { paginate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createRoomSchema, updateRoomSchema, type CreateRoomInput, type UpdateRoomInput } from "@/lib/validations/room"
import { toast } from "sonner"
import type { Room, Dormitory, Bed } from "@prisma/client"

type RoomWithRelations = Room & {
  dormitory: Dormitory
  beds: Bed[]
}

export function RoomsManagement() {
  const [rooms, setRooms] = useState<RoomWithRelations[]>([])
  const [filteredRooms, setFilteredRooms] = useState<RoomWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDormitory, setSelectedDormitory] = useState("all")
  const [selectedRoomType, setSelectedRoomType] = useState("all")
  const [dormitories, setDormitories] = useState<Dormitory[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomWithRelations | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createForm = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      dormitoryId: "",
      roomNumber: "",
      floor: 1,
      roomType: "PHONG_4",
      capacity: 4,
      pricePerSemester: 0,
      description: "",
      isActive: true,
    },
  })

  const editForm = useForm<UpdateRoomInput>({
    resolver: zodResolver(updateRoomSchema),
  })

  useEffect(() => {
    loadRooms()
    loadDormitories()
  }, [])

  useEffect(() => {
    let filtered = rooms

    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.dormitory.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedDormitory && selectedDormitory !== "all") {
      filtered = filtered.filter(room => room.dormitoryId === selectedDormitory)
    }

    if (selectedRoomType && selectedRoomType !== "all") {
      filtered = filtered.filter(room => room.roomType === selectedRoomType)
    }

    setFilteredRooms(filtered)
    setCurrentPage(1)
  }, [rooms, searchQuery, selectedDormitory, selectedRoomType])

  const loadRooms = async () => {
    setIsLoading(true)
    const result = await getAllRoomsAction()

    if (result.success) {
      setRooms(result.data as RoomWithRelations[])
      setCurrentPage(1) // Reset to first page when data changes
    }

    setIsLoading(false)
  }

  const loadDormitories = async () => {
    const result = await getDormitoriesAction()
    if (result.success) {
      setDormitories(result.data)
    }
  }

  const handleCreateRoom = async (data: CreateRoomInput) => {
    setIsSubmitting(true)
    const result = await createRoomAction(data)

    if (result.success) {
      toast.success("Thêm phòng thành công")
      setIsCreateDialogOpen(false)
      createForm.reset()
      await loadRooms()
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
    setIsSubmitting(false)
  }

  const handleEditRoom = async (data: UpdateRoomInput) => {
    if (!editingRoom) return

    setIsSubmitting(true)
    const result = await updateRoomAction(editingRoom.id, data)

    if (result.success) {
      toast.success("Cập nhật phòng thành công")
      setIsEditDialogOpen(false)
      setEditingRoom(null)
      editForm.reset()
      await loadRooms()
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
    setIsSubmitting(false)
  }

  const handleDeleteRoom = async (roomId: string) => {
    const result = await deleteRoomAction(roomId)

    if (result.success) {
      toast.success("Xóa phòng thành công")
      await loadRooms()
    } else {
      toast.error(result.error || "Có lỗi xảy ra")
    }
  }

  const openEditDialog = (room: RoomWithRelations) => {
    setEditingRoom(room)
    editForm.reset({
      roomNumber: room.roomNumber,
      floor: room.floor,
      roomType: room.roomType,
      capacity: room.capacity,
      pricePerSemester: Number(room.pricePerSemester),
      description: room.description || "",
      isActive: room.isActive,
    })
    setIsEditDialogOpen(true)
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

  const paginatedRooms = paginate(filteredRooms.length > 0 ? filteredRooms : rooms, currentPage, 12)

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
      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tổng số phòng: {rooms.length}</CardTitle>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Thêm phòng mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={createForm.handleSubmit(handleCreateRoom)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dormitoryId">Ký túc xá</Label>
                      <Select onValueChange={(value) => createForm.setValue("dormitoryId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn ký túc xá" />
                        </SelectTrigger>
                        <SelectContent>
                          {dormitories.map((dormitory) => (
                            <SelectItem key={dormitory.id} value={dormitory.id}>
                              {dormitory.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber">Số phòng</Label>
                      <Input
                        id="roomNumber"
                        {...createForm.register("roomNumber")}
                        placeholder="VD: MH101"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="floor">Tầng</Label>
                      <Input
                        id="floor"
                        type="number"
                        {...createForm.register("floor", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="roomType">Loại phòng</Label>
                      <Select onValueChange={(value) => createForm.setValue("roomType", value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại phòng" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PHONG_4">Phòng 4 người</SelectItem>
                          <SelectItem value="PHONG_6">Phòng 6 người</SelectItem>
                          <SelectItem value="PHONG_8">Phòng 8 người</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Sức chứa</Label>
                      <Input
                        id="capacity"
                        type="number"
                        {...createForm.register("capacity", { valueAsNumber: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerSemester">Giá thuê/học kỳ</Label>
                      <Input
                        id="pricePerSemester"
                        type="number"
                        {...createForm.register("pricePerSemester", { valueAsNumber: true })}
                        placeholder="VNĐ"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Số giường</Label>
                    <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                      {createForm.watch("capacity") || 0} giường (tự động theo sức chứa)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Input
                      id="description"
                      {...createForm.register("description")}
                      placeholder="Mô tả phòng (tùy chọn)"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="cursor-pointer"
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Xác nhận
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo số phòng hoặc tên ký túc xá..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedDormitory} onValueChange={setSelectedDormitory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Chọn ký túc xá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ký túc xá</SelectItem>
                {dormitories.map((dormitory) => (
                  <SelectItem key={dormitory.id} value={dormitory.id}>
                    {dormitory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Chọn loại phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại phòng</SelectItem>
                <SelectItem value="PHONG_4">Phòng 4 người</SelectItem>
                <SelectItem value="PHONG_6">Phòng 6 người</SelectItem>
                <SelectItem value="PHONG_8">Phòng 8 người</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
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

              <div className="pt-3 border-t flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(room)}
                  className="cursor-pointer"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Sửa
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="cursor-pointer">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận xóa phòng</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn có chắc chắn muốn xóa phòng {room.roomNumber}? Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteRoom(room.id)}
                        className="bg-red-600 hover:bg-red-700 cursor-pointer"
                      >
                        Xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Pagination
        currentPage={paginatedRooms.currentPage}
        totalPages={paginatedRooms.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa phòng</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditRoom)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roomNumber">Số phòng</Label>
                <Input
                  id="edit-roomNumber"
                  {...editForm.register("roomNumber")}
                  placeholder="VD: 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-floor">Tầng</Label>
                <Input
                  id="edit-floor"
                  type="number"
                  {...editForm.register("floor", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-roomType">Loại phòng</Label>
                <Select
                  value={editForm.watch("roomType")}
                  onValueChange={(value) => editForm.setValue("roomType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHONG_4">Phòng 4 người</SelectItem>
                    <SelectItem value="PHONG_6">Phòng 6 người</SelectItem>
                    <SelectItem value="PHONG_8">Phòng 8 người</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Sức chứa</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  {...editForm.register("capacity", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Số giường</Label>
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
                {editForm.watch("capacity") || 0} giường (tự động theo sức chứa)
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-pricePerSemester">Giá thuê/học kỳ</Label>
              <Input
                id="edit-pricePerSemester"
                type="number"
                {...editForm.register("pricePerSemester", { valueAsNumber: true })}
                placeholder="VNĐ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Mô tả</Label>
              <Input
                id="edit-description"
                {...editForm.register("description")}
                placeholder="Mô tả phòng (tùy chọn)"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                {...editForm.register("isActive")}
                className="rounded"
              />
              <Label htmlFor="edit-isActive">Phòng đang hoạt động</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="cursor-pointer"
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Cập nhật
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
