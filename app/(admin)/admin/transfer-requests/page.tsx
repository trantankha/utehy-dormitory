import { requireAuth } from "@/lib/auth"
import { getAllTransferRequestsAction } from "@/actions/transfer"
import { TransferRequestsManagement } from "@/components/admin/transfer-requests-management"

export default async function TransferRequestsPage() {
    const user = await requireAuth(["ADMIN"])

    const transferRequestsResult = await getAllTransferRequestsAction()
    const transferRequests = transferRequestsResult.success ? transferRequestsResult.data : []

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Yêu cầu chuyển phòng</h1>
                <p className="text-gray-600 mt-2">Quản lý tất cả yêu cầu chuyển phòng từ sinh viên</p>
            </div>

            {/* Transfer Requests Management Component */}
            <TransferRequestsManagement />
        </div>
    )
}
