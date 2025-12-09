"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registrationSchema, type RegistrationInput } from "@/lib/validations/registration"
import { createRegistrationAction } from "@/actions/registration"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Room, Dormitory, Bed } from "@prisma/client"
import { Semester } from "@prisma/client"

type RoomWithRelations = Room & {
  dormitory: Dormitory
  beds: Bed[]
}

interface RoomRegistrationDialogProps {
  room: RoomWithRelations
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function RoomRegistrationDialog({ room, isOpen, onClose, onSuccess }: RoomRegistrationDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      roomId: room.id,
    },
  })

  const onSubmit = async (data: RegistrationInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await createRegistrationAction(data)

      if (result.success) {
        reset()
        onClose()
        onSuccess()
        router.push("/student/my-registrations")
        router.refresh()
      } else {
        setError(result.error || "Đăng ký thất bại")
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi đăng ký")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Đăng ký phòng {room.roomNumber}</DialogTitle>
          <DialogDescription>
            {room.dormitory.name} - Giá: {Number(room.pricePerSemester).toLocaleString("vi-VN")} đ/học kỳ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Room Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Ký túc xá:</span>
              <span className="font-medium">{room.dormitory.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phòng:</span>
              <span className="font-medium">{room.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tầng:</span>
              <span className="font-medium">Tầng {room.floor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Còn trống:</span>
              <span className="font-medium">
                {room.capacity - room.occupied}/{room.capacity} giường
              </span>
            </div>
          </div>

          {/* Semester Selection */}
          <div className="space-y-2">
            <Label htmlFor="semester">Học kỳ đăng ký *</Label>
            <select
              id="semester"
              {...register("semester")}
              disabled={isLoading}
              className="flex h-10 w-full rounded-md border border-input bg-background
               px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm
                file:font-medium placeholder:text-muted-foreground focus-visible:outline-none 
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 
                disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Chọn học kỳ</option>
              {Object.values(Semester).map((sem) => (
                <option key={sem} value={sem}>
                  {sem.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {errors.semester && <p className="text-sm text-red-600">{errors.semester.message}</p>}
          </div>

          {/* Bed Selection */}
          {room.beds.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bedId">Chọn giường (tùy chọn)</Label>
              <select
                id="bedId"
                {...register("bedId")}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Chọn sau</option>
                {room.beds.map((bed) => (
                  <option key={bed.id} value={bed.id}>
                    Giường số {bed.bedNumber}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Bạn có thể chọn giường cụ thể hoặc để quản lý phân bổ sau</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
            <textarea
              id="notes"
              {...register("notes")}
              disabled={isLoading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Nhập ghi chú nếu có..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận đăng ký"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
