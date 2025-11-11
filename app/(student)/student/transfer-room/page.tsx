"use client"

import { useState, useEffect } from "react"
import { getStudentTransferRequestsAction } from "@/actions/transfer"
import { getCurrentSemester } from "@/lib/utils/semester"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RoomTransferDialog } from "@/components/student/room-transfer-dialog"

type TransferRequest = {
    id: string
    semester: string
    status: string
    reason: string
    adminNotes?: string | null
    requestedAt: Date
    approvedAt?: Date | null
    rejectedAt?: Date | null
    completedAt?: Date | null
    currentRoom: {
        dormitory: { name: string }
        roomNumber: string
    }
    currentBed?: {
        bedNumber: number
    } | null
    newRoom: {
        dormitory: { name: string }
        roomNumber: string
    }
    newBed?: {
        bedNumber: number
    } | null
}

export default function TransferRoomPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const currentSemester = getCurrentSemester()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const transferRequestsResult = await getStudentTransferRequestsAction()
                if (transferRequestsResult.success) {
                    setTransferRequests(transferRequestsResult.data as TransferRequest[])
                }
            } catch (error) {
                console.error("Failed to fetch transfer requests:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const handleDialogClose = () => setIsDialogOpen(false)
    const handleDialogSuccess = () => {
        setIsDialogOpen(false)
        // Refresh transfer requests
        const fetchData = async () => {
            const transferRequestsResult = await getStudentTransferRequestsAction()
            if (transferRequestsResult.success) {
                setTransferRequests(transferRequestsResult.data as TransferRequest[])
            }
        }
        fetchData()
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Chuyển phòng</h1>
                    <p className="text-gray-600 mt-2">Quản lý yêu cầu chuyển phòng của bạn</p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="cursor-pointer">
                    Gửi yêu cầu chuyển phòng
                </Button>
                <RoomTransferDialog
                    isOpen={isDialogOpen}
                    onClose={handleDialogClose}
                    onSuccess={handleDialogSuccess}
                    currentSemester={currentSemester}
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tổng yêu cầu</CardTitle>
                        <CardDescription>Tất cả yêu cầu chuyển phòng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{transferRequests.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Chờ xác nhận</CardTitle>
                        <CardDescription>Đang chờ admin duyệt</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-orange-600">
                            {transferRequests.filter(r => r.status === "CHO_XAC_NHAN").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Đã duyệt</CardTitle>
                        <CardDescription>Đã được admin duyệt</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {transferRequests.filter(r => r.status === "DA_DUYET").length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Đã hoàn tất</CardTitle>
                        <CardDescription>Đã chuyển phòng thành công</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                            {transferRequests.filter(r => r.status === "DA_HOAN_TAT").length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transfer Requests List */}
            <Card>
                <CardHeader>
                    <CardTitle>Lịch sử yêu cầu chuyển phòng</CardTitle>
                    <CardDescription>Danh sách tất cả yêu cầu chuyển phòng của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                    {transferRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">Bạn chưa có yêu cầu chuyển phòng nào</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Nhấn nút "Gửi yêu cầu chuyển phòng" để bắt đầu
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transferRequests.map((request) => (
                                <div key={request.id} className="border rounded-lg p-6 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">Yêu cầu chuyển phòng</h3>
                                            <p className="text-sm text-gray-600">
                                                Học kỳ: {request.semester.replace(/_/g, " ")}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                request.status === "CHO_XAC_NHAN" ? "secondary" :
                                                    request.status === "DA_DUYET" ? "default" :
                                                        request.status === "DA_HOAN_TAT" ? "default" :
                                                            "destructive"
                                            }
                                            className={
                                                request.status === "DA_DUYET" ? "bg-blue-600" :
                                                    request.status === "DA_HOAN_TAT" ? "bg-green-600" : ""
                                            }
                                        >
                                            {request.status === "CHO_XAC_NHAN" && "Chờ xác nhận"}
                                            {request.status === "DA_DUYET" && "Đã duyệt"}
                                            {request.status === "TU_CHOI" && "Từ chối"}
                                            {request.status === "DA_HOAN_TAT" && "Đã hoàn tất"}
                                        </Badge>
                                    </div>

                                    {/* Room Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <p className="text-sm font-medium text-red-900">Phòng hiện tại</p>
                                            <p className="text-lg font-semibold text-red-800">
                                                {request.currentRoom.dormitory.name} - Phòng {request.currentRoom.roomNumber}
                                            </p>
                                            {request.currentBed && (
                                                <p className="text-sm text-red-700">Giường: {request.currentBed.bedNumber}</p>
                                            )}
                                        </div>

                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <p className="text-sm font-medium text-green-900">Phòng mới</p>
                                            <p className="text-lg font-semibold text-green-800">
                                                {request.newRoom.dormitory.name} - Phòng {request.newRoom.roomNumber}
                                            </p>
                                            {request.newBed && (
                                                <p className="text-sm text-green-700">Giường: {request.newBed.bedNumber}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Lý do chuyển phòng</p>
                                        <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-md">{request.reason}</p>
                                    </div>

                                    {/* Admin Notes */}
                                    {request.adminNotes && (
                                        <div className="bg-blue-50 p-3 rounded-md">
                                            <p className="text-sm font-medium text-blue-900">Ghi chú của quản lý</p>
                                            <p className="text-sm text-blue-800 mt-1">{request.adminNotes}</p>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium mb-2">Lịch sử</p>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p>• Yêu cầu: {new Date(request.requestedAt).toLocaleString("vi-VN")}</p>
                                            {request.approvedAt && (
                                                <p>• Duyệt: {new Date(request.approvedAt).toLocaleString("vi-VN")}</p>
                                            )}
                                            {request.rejectedAt && (
                                                <p>• Từ chối: {new Date(request.rejectedAt).toLocaleString("vi-VN")}</p>
                                            )}
                                            {request.completedAt && (
                                                <p>• Hoàn tất: {new Date(request.completedAt).toLocaleString("vi-VN")}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
