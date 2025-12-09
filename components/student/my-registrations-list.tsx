"use client"

import { useEffect, useState } from "react"
import { getStudentRegistrationsAction, cancelRegistrationAction } from "@/actions/registration"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, Calendar } from "lucide-react"
import type { Registration, Room, Dormitory, Bed } from "@prisma/client"
import { PaymentForm } from "./payment-form"
import { ContractExtensionDialog } from "./contract-extension-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type RegistrationWithRelations = Registration & {
  room: Room & {
    dormitory: Dormitory
  }
  bed: Bed | null
}

export function MyRegistrationsList() {
  const [registrations, setRegistrations] = useState<RegistrationWithRelations[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)
  const [showExtensionDialog, setShowExtensionDialog] = useState<string | null>(null)

  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    setIsLoading(true)
    const result = await getStudentRegistrationsAction()

    if (result.success) {
      setRegistrations(result.data as RegistrationWithRelations[])
    }

    setIsLoading(false)
  }

  const handleCancel = async (registrationId: string) => {
    if (!confirm("Bạn có chắc chắn muốn hủy phiếu đăng ký này?")) {
      return
    }

    setCancellingId(registrationId)
    setError(null)

    const result = await cancelRegistrationAction(registrationId)

    if (result.success) {
      await loadRegistrations()
    } else {
      setError(result.error || "Hủy phiếu thất bại")
    }

    setCancellingId(null)
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

  if (registrations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600 mb-4">Bạn chưa có phiếu đăng ký nào</p>
          <Button asChild>
            <a href="/student/register-room">Đăng ký phòng ngay</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6">
        {registrations.map((registration) => (
          <Card key={registration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
                  </CardTitle>
                  <CardDescription>
                    Đăng ký ngày: {new Date(registration.registeredAt).toLocaleDateString("vi-VN")}
                  </CardDescription>
                </div>
                {getStatusBadge(registration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Registration Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                    {Number(registration.room.pricePerSemester).toLocaleString("vi-VN")} đ/học kỳ
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Tầng</p>
                  <p className="font-medium">Tầng {registration.room.floor}</p>
                </div>
              </div>

              {/* Notes */}
              {registration.notes && (
                <div>
                  <p className="text-sm text-gray-600">Ghi chú của bạn</p>
                  <p className="text-sm mt-1">{registration.notes}</p>
                </div>
              )}

              {/* Admin Notes */}
              {registration.adminNotes && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-900 font-medium">Ghi chú từ quản lý</p>
                  <p className="text-sm text-blue-800 mt-1">{registration.adminNotes}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Lịch sử</p>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>• Đăng ký: {new Date(registration.registeredAt).toLocaleString("vi-VN")}</p>
                  {registration.confirmedAt && (
                    <p>• Xác nhận: {new Date(registration.confirmedAt).toLocaleString("vi-VN")}</p>
                  )}
                  {registration.paidAt && <p>• Thanh toán: {new Date(registration.paidAt).toLocaleString("vi-VN")}</p>}
                  {registration.cancelledAt && (
                    <p>• Hủy: {new Date(registration.cancelledAt).toLocaleString("vi-VN")}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              {registration.status === "CHO_XAC_NHAN" && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleCancel(registration.id)}
                    disabled={cancellingId === registration.id}
                  >
                    {cancellingId === registration.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang hủy...
                      </>
                    ) : (
                      "Hủy đăng ký"
                    )}
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                {/* Contract Extension */}
                {(registration.status === "DA_XAC_NHAN" || registration.status === "DA_THANH_TOAN") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExtensionDialog(showExtensionDialog === registration.id ? null : registration.id)}
                    className="cursor-pointer"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Gia hạn hợp đồng
                  </Button>
                )}

                {/* Payment Actions */}
                {registration.status === "DA_XAC_NHAN" && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setShowPaymentForm(showPaymentForm === registration.id ? null : registration.id)}
                    className="cursor-pointer"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    {showPaymentForm === registration.id ? "Hủy thanh toán" : "Thanh toán"}
                  </Button>
                )}
              </div>

              {/* Payment Dialog */}
              <Dialog open={showPaymentForm === registration.id} onOpenChange={(open) => !open && setShowPaymentForm(null)}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Thanh toán ký túc xá</DialogTitle>
                  </DialogHeader>
                  <PaymentForm
                    type="registration"
                    entityId={registration.id}
                    amount={Number(registration.room.pricePerSemester)}
                    description={`Thanh toán ký túc xá học kỳ ${registration.semester.replace(/_/g, " ")}`}
                    onSuccess={() => {
                      setShowPaymentForm(null)
                      loadRegistrations()
                    }}
                    onCancel={() => setShowPaymentForm(null)}
                  />
                </DialogContent>
              </Dialog>

              {/* Contract Extension Dialog */}
              <ContractExtensionDialog
                registration={registration}
                open={showExtensionDialog === registration.id}
                onOpenChange={(open) => !open && setShowExtensionDialog(null)}
                onSuccess={() => {
                  setShowExtensionDialog(null)
                  loadRegistrations()
                }}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
