"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { updateRegistrationStatusSchema, type UpdateRegistrationStatusInput } from "@/lib/validations/registration"
import { updateRegistrationStatusAction } from "@/actions/admin"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Registration, Student, Room, Dormitory, Bed } from "@prisma/client"

type RegistrationWithRelations = Registration & {
  student: Student
  room: Room & {
    dormitory: Dormitory
  }
  bed: Bed | null
}

interface UpdateStatusDialogProps {
  registration: RegistrationWithRelations
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function UpdateStatusDialog({ registration, isOpen, onClose, onSuccess }: UpdateStatusDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register: registerForm,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateRegistrationStatusInput>({
    resolver: zodResolver(updateRegistrationStatusSchema),
  })

  const onSubmit = async (data: UpdateRegistrationStatusInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updateRegistrationStatusAction(registration.id, data)

      if (result.success) {
        reset()
        onClose()
        onSuccess()
      } else {
        setError(result.error || "Cập nhật thất bại")
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi cập nhật")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cập nhật trạng thái phiếu đăng ký</DialogTitle>
          <DialogDescription>
            Sinh viên: {registration.student.fullName} ({registration.student.studentCode})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái hiện tại:</span>
              <span className="font-medium">
                {registration.status === "CHO_XAC_NHAN" && "Chờ xác nhận"}
                {registration.status === "DA_XAC_NHAN" && "Đã xác nhận"}
                {registration.status === "DA_THANH_TOAN" && "Đã thanh toán"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phòng:</span>
              <span className="font-medium">
                {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Học kỳ:</span>
              <span className="font-medium">{registration.semester.replace(/_/g, " ")}</span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái mới *</Label>
            <select
              id="status"
              {...registerForm("status")}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 
              text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium 
              placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed 
              disabled:opacity-50 cursor-pointer mt-2"
            >
              <option value="">Chọn trạng thái</option>
              {registration.status === "CHO_XAC_NHAN" && (
                <>
                  <option value="DA_XAC_NHAN">Xác nhận</option>
                  <option value="TU_CHOI">Từ chối</option>
                </>
              )}
              {registration.status === "DA_XAC_NHAN" && <option value="DA_THANH_TOAN">Đã thanh toán</option>}
            </select>
            {errors.status && <p className="text-sm text-red-600">Chọn trạng thái "Xác nhận" hoặc "Từ chối"</p>}
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Ghi chú của quản lý (tùy chọn)</Label>
            <textarea
              id="adminNotes"
              {...registerForm("adminNotes")}
              disabled={isLoading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm 
              ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none 
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
              disabled:cursor-not-allowed disabled:opacity-50 mt-2"
              placeholder="Nhập ghi chú nếu có..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="cursor-pointer">
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Cập nhật"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
