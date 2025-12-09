"use client"

import { useEffect, useState } from "react"
import { getAllTransferRequestsAction, approveTransferRequestAction, rejectTransferRequestAction, completeTransferRequestAction } from "@/actions/transfer"
import { getCurrentSemester } from "@/lib/utils/semester"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react"
import { paginate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"
import { UpdateTransferDialog } from "./update-transfer-dialog"
import type { TransferRequest, Student, Room, Dormitory, Bed } from "@prisma/client"

type TransferRequestWithRelations = TransferRequest & {
    student: Student
    currentRoom: Room & {
        dormitory: Dormitory
    }
    newRoom: Room & {
        dormitory: Dormitory
    }
    currentBed: Bed | null
    newBed: Bed | null
}

export function TransferRequestsManagement() {
    const [transferRequests, setTransferRequests] = useState<TransferRequestWithRelations[]>([])
    const [filteredRequests, setFilteredRequests] = useState<TransferRequestWithRelations[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRequest, setSelectedRequest] = useState<TransferRequestWithRelations | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [statusFilter, setStatusFilter] = useState<string>("")
    const [currentPage, setCurrentPage] = useState(1)

    useEffect(() => {
        loadTransferRequests()
    }, [])

    useEffect(() => {
        if (statusFilter) {
            setFilteredRequests(transferRequests.filter((r) => r.status === statusFilter))
        } else {
            setFilteredRequests(transferRequests)
        }
        setCurrentPage(1) // Reset to first page when filter changes
    }, [statusFilter, transferRequests])

    const loadTransferRequests = async () => {
        setIsLoading(true)
        const result = await getAllTransferRequestsAction()

        if (result.success) {
            setTransferRequests(result.data as TransferRequestWithRelations[])
            setFilteredRequests(result.data as TransferRequestWithRelations[])
        }

        setIsLoading(false)
    }

    const handleUpdateStatus = (request: TransferRequestWithRelations) => {
        setSelectedRequest(request)
        setIsDialogOpen(true)
    }

    const handleApprove = async (requestId: string) => {
        if (!confirm("Bạn có chắc chắn muốn duyệt yêu cầu chuyển phòng này?")) {
            return
        }

        const result = await approveTransferRequestAction(requestId)
        if (result.success) {
            loadTransferRequests()
        } else {
            alert(result.error || "Duyệt yêu cầu thất bại")
        }
    }

    const handleReject = async (requestId: string) => {
        if (!confirm("Bạn có chắc chắn muốn từ chối yêu cầu chuyển phòng này?")) {
            return
        }

        const result = await rejectTransferRequestAction(requestId)
        if (result.success) {
            loadTransferRequests()
        } else {
            alert(result.error || "Từ chối yêu cầu thất bại")
        }
    }

    const handleComplete = async (requestId: string) => {
        if (!confirm("Bạn có chắc chắn muốn đánh dấu hoàn tất chuyển phòng này?")) {
            return
        }

        const result = await completeTransferRequestAction(requestId)
        if (result.success) {
            loadTransferRequests()
        } else {
            alert(result.error || "Hoàn tất chuyển phòng thất bại")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "CHO_XAC_NHAN":
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Chờ xác nhận</Badge>
            case "DA_DUYET":
                return <Badge className="bg-blue-600"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>
            case "TU_CHOI":
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Từ chối</Badge>
            case "DA_HOAN_TAT":
                return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Đã hoàn tất</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    // Pagination logic
    const paginatedRequests = paginate(filteredRequests, currentPage, 10)
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
                            Tất cả ({transferRequests.length})
                        </Button>
                        <Button
                            variant={statusFilter === "CHO_XAC_NHAN" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("CHO_XAC_NHAN")}
                            className="cursor-pointer"
                        >
                            Chờ xác nhận ({transferRequests.filter((r) => r.status === "CHO_XAC_NHAN").length})
                        </Button>
                        <Button
                            variant={statusFilter === "DA_DUYET" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("DA_DUYET")}
                            className="cursor-pointer"
                        >
                            Đã duyệt ({transferRequests.filter((r) => r.status === "DA_DUYET").length})
                        </Button>
                        <Button
                            variant={statusFilter === "DA_HOAN_TAT" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setStatusFilter("DA_HOAN_TAT")}
                            className="cursor-pointer"
                        >
                            Đã hoàn tất ({transferRequests.filter((r) => r.status === "DA_HOAN_TAT").length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Transfer Requests List */}
            {filteredRequests.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600">Không có yêu cầu chuyển phòng nào</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {paginatedRequests.data.map((request) => (
                        <Card key={request.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold">{request.student.fullName}</h3>
                                        <p className="text-sm text-gray-600">
                                            Mã SV: {request.student.studentCode} • {request.student.email}
                                        </p>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Transfer Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Phòng hiện tại</p>
                                        <p className="font-medium">
                                            {request.currentRoom.dormitory.name} - Phòng {request.currentRoom.roomNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Phòng mới</p>
                                        <p className="font-medium">
                                            {request.newRoom.dormitory.name} - Phòng {request.newRoom.roomNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Học kỳ</p>
                                        <p className="font-medium">{request.semester.replace(/_/g, " ")}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Ngày yêu cầu</p>
                                        <p className="font-medium">{new Date(request.requestedAt).toLocaleString("vi-VN")}</p>
                                    </div>
                                </div>

                                {/* Beds */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-600">Giường hiện tại</p>
                                        <p className="font-medium">
                                            {request.currentBed ? `Giường số ${request.currentBed.bedNumber}` : "Chưa chọn"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Giường mới</p>
                                        <p className="font-medium">
                                            {request.newBed ? `Giường số ${request.newBed.bedNumber}` : "Chưa chọn"}
                                        </p>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div>
                                    <p className="text-sm text-gray-600">Lý do chuyển phòng</p>
                                    <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">{request.reason}</p>
                                </div>

                                {/* Admin Notes */}
                                {request.adminNotes && (
                                    <div className="bg-blue-50 p-3 rounded-md">
                                        <p className="text-sm text-blue-900 font-medium">Ghi chú của quản lý</p>
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

                                {/* Actions */}
                                {request.status === "CHO_XAC_NHAN" && (
                                    <div className="flex justify-end pt-2 border-t space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(request.id)}
                                            className="cursor-pointer"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Từ chối
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApprove(request.id)}
                                            className="cursor-pointer"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Duyệt
                                        </Button>
                                    </div>
                                )}

                                {request.status === "DA_DUYET" && (
                                    <div className="flex justify-end pt-2 border-t">
                                        <Button
                                            size="sm"
                                            onClick={() => handleComplete(request.id)}
                                            className="cursor-pointer"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Đánh dấu hoàn tất
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Pagination
                currentPage={paginatedRequests.currentPage}
                totalPages={paginatedRequests.totalPages}
                onPageChange={handlePageChange}
            />

            {/* Update Status Dialog */}
            {selectedRequest && (
                <UpdateTransferDialog
                    transferRequest={selectedRequest}
                    isOpen={isDialogOpen}
                    onClose={() => {
                        setIsDialogOpen(false)
                        setSelectedRequest(null)
                    }}
                    onSuccess={() => {
                        loadTransferRequests()
                    }}
                    currentSemester={getCurrentSemester()}
                />
            )}
        </div>
    )
}
