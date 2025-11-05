import { getStudentUtilityBillsAction } from "@/actions/utility"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react"

export default async function StudentUtilityBillsPage() {
    const result = await getStudentUtilityBillsAction()
    const bills = result.data || []

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Chờ thanh toán</Badge>
            case "PAID":
                return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Đã thanh toán</Badge>
            case "OVERDUE":
                return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Quá hạn</Badge>
            case "CANCELLED":
                return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" />Đã hủy</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Hóa đơn điện nước</h1>
                <p className="text-gray-600 mt-2">Xem và theo dõi hóa đơn điện nước của phòng</p>
            </div>

            {/* Bills List */}
            {bills.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Chưa có hóa đơn nào</p>
                        <p className="text-sm text-gray-500">Hóa đơn sẽ được tạo vào đầu tháng sau</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bills.map((bill) => (
                        <Card key={bill.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Hóa đơn tháng {bill.month}/{bill.year}</CardTitle>
                                    {getStatusBadge(bill.status)}
                                </div>
                                <CardDescription>
                                    Phòng của bạn
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tiêu thụ điện:</span>
                                        <span className="font-medium">{bill.electricityUsage} kWh</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tiêu thụ nước:</span>
                                        <span className="font-medium">{bill.waterUsage} m³</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tiền điện:</span>
                                        <span className="font-medium">{Number(bill.electricityAmount).toLocaleString("vi-VN")} đ</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tiền nước:</span>
                                        <span className="font-medium">{Number(bill.waterAmount).toLocaleString("vi-VN")} đ</span>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Tổng tiền:</span>
                                            <span className="text-blue-600">{Number(bill.totalAmount).toLocaleString("vi-VN")} đ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <p className="text-sm text-gray-600">
                                        Hạn thanh toán: {new Date(bill.dueDate).toLocaleDateString("vi-VN")}
                                    </p>
                                </div>

                                {bill.notes && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-gray-600">{bill.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
