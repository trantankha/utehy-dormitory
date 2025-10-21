"use client"

import { useEffect, useState } from "react"
import { getAllRegistrationsAction } from "@/actions/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { UpdateStatusDialog } from "./update-status-dialog"
import type { Registration, Student, Room, Dormitory, Bed } from "@prisma/client"

type RegistrationWithRelations = Registration & {
  student: Student
  room: Room & {
    dormitory: Dormitory
  }
  bed: Bed | null
}

export function RegistrationsManagement() {
  const [registrations, setRegistrations] = useState<RegistrationWithRelations[]>([])
  const [filteredRegistrations, setFilteredRegistrations] = useState<RegistrationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationWithRelations | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("")

  useEffect(() => {
    loadRegistrations()
  }, [])

  useEffect(() => {
    if (statusFilter) {
      setFilteredRegistrations(registrations.filter((r) => r.status === statusFilter))
    } else {
      setFilteredRegistrations(registrations)
    }
  }, [statusFilter, registrations])

  const loadRegistrations = async () => {
    setIsLoading(true)
    const result = await getAllRegistrationsAction()

    if (result.success) {
      setRegistrations(result.data as RegistrationWithRelations[])
      setFilteredRegistrations(result.data as RegistrationWithRelations[])
    }

    setIsLoading(false)
  }

  const handleUpdateStatus = (registration: RegistrationWithRelations) => {
    setSelectedRegistration(registration)
    setIsDialogOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CHO_XAC_NHAN":
        return <Badge variant="secondary">Chờ xác nhận</Badge>
      case "DA_XAC_NHAN":
        return <Badge className="bg-blue-600">Đã xác nhận</Badge>
      case "DA_THANH_TOAN":
        return <Badge className="bg-green-600">Đã thanh toán</Badge>
      case "DA_HUY":
        return <Badge variant="destructive">Đã hủy</Badge>
      case "TU_CHOI":
        return <Badge variant="destructive">Từ chối</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="text-gray-600 mt-4">Đang tải danh sách...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant={statusFilter === "" ? "default" : "outline"} size="sm"
              onClick={() => setStatusFilter("")}
              className="cursor-pointer"
            >
              Tất cả ({registrations.length})
            </Button>
            <Button
              variant={statusFilter === "CHO_XAC_NHAN" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("CHO_XAC_NHAN")}
              className="cursor-pointer"
            >
              Chờ xác nhận ({registrations.filter((r) => r.status === "CHO_XAC_NHAN").length})
            </Button>
            <Button
              variant={statusFilter === "DA_XAC_NHAN" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("DA_XAC_NHAN")}
              className="cursor-pointer"
            >
              Đã xác nhận ({registrations.filter((r) => r.status === "DA_XAC_NHAN").length})
            </Button>
            <Button
              variant={statusFilter === "DA_THANH_TOAN" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("DA_THANH_TOAN")}
              className="cursor-pointer"
            >
              Đã thanh toán ({registrations.filter((r) => r.status === "DA_THANH_TOAN").length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600">Không có phiếu đăng ký nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRegistrations.map((registration) => (
            <Card key={registration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{registration.student.fullName}</h3>
                    <p className="text-sm text-gray-600">
                      Mã SV: {registration.student.studentCode} • {registration.student.email}
                    </p>
                  </div>
                  {getStatusBadge(registration.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Registration Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Phòng</p>
                    <p className="font-medium">
                      {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Học kỳ</p>
                    <p className="font-medium">{registration.semester.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Giường</p>
                    <p className="font-medium">
                      {registration.bed ? `Giường số ${registration.bed.bedNumber}` : "Chưa chọn"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Giá thuê</p>
                    <p className="font-medium text-blue-600">
                      {Number(registration.room.pricePerSemester).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ngày đăng ký</p>
                    <p className="font-medium">{new Date(registration.registeredAt).toLocaleString("vi-VN")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sinh viên</p>
                    <p className="font-medium">
                      {registration.student.gender} • {registration.student.course}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                {registration.notes && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-600">Ghi chú từ sinh viên:</p>
                    <p className="text-sm mt-1">{registration.notes}</p>
                  </div>
                )}

                {registration.adminNotes && (
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-900 font-medium">Ghi chú của quản lý:</p>
                    <p className="text-sm text-blue-800 mt-1">{registration.adminNotes}</p>
                  </div>
                )}

                {/* Actions */}
                {registration.status !== "DA_HUY" && registration.status !== "TU_CHOI" && (
                  <div className="flex justify-end pt-2 border-t">
                    <Button size="sm" onClick={() => handleUpdateStatus(registration)}>
                      Cập nhật trạng thái
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update Status Dialog */}
      {selectedRegistration && (
        <UpdateStatusDialog
          registration={selectedRegistration}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false)
            setSelectedRegistration(null)
          }}
          onSuccess={() => {
            loadRegistrations()
          }}
        />
      )}
    </div>
  )
}
