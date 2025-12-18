import { UtilityManagement } from "@/components/admin/utility-management"

export default function UtilityManagementPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý điện nước</h1>
                <p className="text-gray-600 mt-2">Quản lý biểu giá, ghi chỉ số và hóa đơn điện nước</p>
            </div>

            {/* Utility Management */}
            <UtilityManagement />
        </div>
    )
}
