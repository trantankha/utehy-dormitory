"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { transferRequestSchema, type TransferRequestInput } from "@/lib/validations/transfer"
import { requestRoomTransferAction } from "@/actions/transfer"
import { getAvailableRoomsAction } from "@/actions/room"
import { formatSemester } from "@/lib/utils/semester"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import type { Room, Dormitory, Bed } from "@prisma/client"

type RoomWithRelations = Room & {
    dormitory: Dormitory
    beds: Bed[]
}

interface RoomTransferDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    currentSemester: string
}

export function RoomTransferDialog({ isOpen, onClose, onSuccess, currentSemester }: RoomTransferDialogProps) {
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [availableRooms, setAvailableRooms] = useState<RoomWithRelations[]>([])
    const [selectedRoom, setSelectedRoom] = useState<RoomWithRelations | null>(null)

    const {
        register: registerForm,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<TransferRequestInput>({
        resolver: zodResolver(transferRequestSchema),
    })

    const selectedRoomId = watch("newRoomId")

    useEffect(() => {
        if (isOpen) {
            loadAvailableRooms()
            setValue("semester", currentSemester as any)
        }
    }, [isOpen, currentSemester, setValue])

    useEffect(() => {
        if (selectedRoomId) {
            const room = availableRooms.find(r => r.id === selectedRoomId)
            setSelectedRoom(room || null)
            // Reset bed selection when room changes
            setValue("newBedId", "")
        }
    }, [selectedRoomId, availableRooms, setValue])

    const loadAvailableRooms = async () => {
        const result = await getAvailableRoomsAction()
        if (result.success) {
            setAvailableRooms(result.data as RoomWithRelations[])
        }
    }

    const onSubmit = async (data: TransferRequestInput) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await requestRoomTransferAction(data)

            if (result.success) {
                reset()
                onClose()
                onSuccess()
            } else {
                setError(result.error || "Gửi yêu cầu thất bại")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi gửi yêu cầu")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Yêu cầu chuyển phòng</DialogTitle>
                    <DialogDescription>
                        Gửi yêu cầu chuyển sang phòng khác trong cùng học kỳ
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
                            <span className="text-gray-600">Học kỳ:</span>
                            <span className="font-medium">{formatSemester(currentSemester as any)}</span>
                        </div>
                    </div>

                    {/* New Room Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="newRoomId">Phòng muốn chuyển đến *</Label>
                        <Select onValueChange={(value) => setValue("newRoomId", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn phòng mới" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRooms.map((room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                        {room.dormitory.name} - Phòng {room.roomNumber} ({room.capacity - room.occupied} chỗ trống)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.newRoomId && <p className="text-sm text-red-600">{errors.newRoomId.message}</p>}
                    </div>

                    {/* New Bed Selection */}
                    {selectedRoom && selectedRoom.beds.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="newBedId">Giường muốn chọn (tùy chọn)</Label>
                            <Select onValueChange={(value) => setValue("newBedId", value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn giường cụ thể (tùy chọn)" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedRoom.beds
                                        .filter(bed => bed.status === "AVAILABLE")
                                        .map((bed) => (
                                            <SelectItem key={bed.id} value={bed.id}>
                                                Giường số {bed.bedNumber}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Lý do chuyển phòng *</Label>
                        <Textarea
                            id="reason"
                            {...registerForm("reason")}
                            rows={4}
                            placeholder="Vui lòng mô tả lý do bạn muốn chuyển phòng..."
                            className="mt-2"
                        />
                        {errors.reason && <p className="text-sm text-red-600">{errors.reason.message}</p>}
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
                                    Đang gửi...
                                </>
                            ) : (
                                "Gửi yêu cầu"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
