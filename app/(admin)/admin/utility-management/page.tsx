import { getCurrentUtilityRatesAction, getMeterReadingsAction, getUtilityBillsAction } from "@/actions/utility"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UtilityRatesManager } from "@/components/admin/utility-rates-manager"
import { MeterReadingsManager } from "@/components/admin/meter-readings-manager"
import { UtilityBillsManager } from "@/components/admin/utility-bills-manager"

export default async function UtilityManagementPage() {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear()

    // Lấy dữ liệu cho trang hiện tại
    const [ratesResult, readingsResult, billsResult] = await Promise.all([
        getCurrentUtilityRatesAction(),
        getMeterReadingsAction(currentMonth, currentYear),
        getUtilityBillsAction(currentMonth, currentYear),
    ])

    const rates = ratesResult.data || []
    const readings = readingsResult.data || []
    const bills = billsResult.data || []

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Quản lý điện nước</h1>
                <p className="text-gray-600 mt-2">Quản lý biểu giá, ghi chỉ số và hóa đơn điện nước</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Biểu giá hiện tại</CardTitle>
                        <CardDescription>Đơn giá điện nước đang áp dụng</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {rates.length > 0 ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Điện:</span>
                                        <span className="font-medium">{Number(rates[0].electricityRate).toLocaleString("vi-VN")} đ/kWh</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nước:</span>
                                        <span className="font-medium">{Number(rates[0].waterRate).toLocaleString("vi-VN")} đ/m³</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-600">Chưa có biểu giá</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Ghi chỉ số tháng này</CardTitle>
                        <CardDescription>Số phòng đã ghi chỉ số</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{readings.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Hóa đơn tháng này</CardTitle>
                        <CardDescription>Số hóa đơn đã tạo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">{bills.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="rates" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="rates">Biểu giá</TabsTrigger>
                    <TabsTrigger value="readings">Ghi chỉ số</TabsTrigger>
                    <TabsTrigger value="bills">Hóa đơn</TabsTrigger>
                </TabsList>

                <TabsContent value="rates">
                    <UtilityRatesManager />
                </TabsContent>

                <TabsContent value="readings">
                    <MeterReadingsManager />
                </TabsContent>

                <TabsContent value="bills">
                    <UtilityBillsManager />
                </TabsContent>
            </Tabs>
        </div>
    )
}
