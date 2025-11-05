"use client"

import { useEffect, useState } from "react"
import { getUtilityBillsAction, calculateUtilityBillsAction, updateUtilityBillStatusAction } from "@/actions/utility"
import { exportUtilityBillsExcelAction } from "@/actions/excel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Calculator, CheckCircle, Clock, AlertTriangle, XCircle, Download, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function UtilityBillsManager() {
    const [bills, setBills] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCalculating, setIsCalculating] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        loadBills()
    }, [selectedMonth, selectedYear])

    const loadBills = async () => {
        setIsLoading(true)
        const result = await getUtilityBillsAction(selectedMonth, selectedYear)

        if (result.success) {
            setBills(result.data)
        }

        setIsLoading(false)
    }

    const handleCalculateBills = async () => {
        setIsCalculating(true)
        setError(null)
        setSuccess(null)

        try {
            const result = await calculateUtilityBillsAction(selectedMonth, selectedYear)

            if (result.success) {
                setSuccess(`Đã tính tiền cho ${result.data.length} phòng và gửi email thông báo`)
                await loadBills()
            } else {
                setError(result.error || "Tính tiền thất bại")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi tính tiền")
        } finally {
            setIsCalculating(false)
        }
    }

    const handleUpdateStatus = async (billId: string, newStatus: string) => {
        try {
            const result = await updateUtilityBillStatusAction(billId, { status: newStatus as "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" })

            if (result.success) {
                setSuccess("Cập nhật trạng thái thành công")
                await loadBills()
            } else {
                setError(result.error || "Cập nhật thất bại")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi cập nhật")
        }
    }

    // Excel export function
    const handleExportExcel = async () => {
        const result = await exportUtilityBillsExcelAction(selectedMonth, selectedYear)

        if (result.success) {
            // Create download link
            const link = document.createElement('a')
            link.href = `data:${result.data?.mimeType};base64,${result.data?.buffer}`
            link.download = result.data!.fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            setError(result.error || "Xuất Excel thất bại")
        }
    }

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`,
    }))

    const years = Array.from({ length: 5 }, (_, i) => ({
        value: new Date().getFullYear() - 2 + i,
        label: `${new Date().getFullYear() - 2 + i}`,
    }))

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

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-4">Đang tải...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Hóa đơn điện nước</h2>
                    <p className="text-gray-600">Quản lý và thanh toán hóa đơn</p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Month/Year Selector */}
                    <div className="flex items-center space-x-2">
                        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {months.map((month) => (
                                    <SelectItem key={month.value} value={month.value.toString()}>
                                        {month.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                            <SelectTrigger className="w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year.value} value={year.value.toString()}>
                                        {year.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Excel Export Button */}
                    <Button variant="outline" onClick={handleExportExcel}>
                        <Download className="mr-2 h-4 w-4" />
                        Xuất Excel
                    </Button>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button disabled={isCalculating}>
                                <Calculator className="mr-2 h-4 w-4" />
                                Tính tiền tháng này
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tính tiền điện nước</DialogTitle>
                                <DialogDescription>
                                    Tính tiền điện nước cho tất cả phòng trong tháng {selectedMonth}/{selectedYear}.
                                    Hệ thống sẽ tự động tạo hóa đơn dựa trên chỉ số đã ghi và biểu giá hiện tại.
                                    Sinh viên sẽ nhận được email thông báo về hóa đơn mới.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button variant="outline" onClick={() => { }}>
                                    Hủy
                                </Button>
                                <Button onClick={handleCalculateBills} disabled={isCalculating}>
                                    {isCalculating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang tính...
                                        </>
                                    ) : (
                                        "Tính tiền"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert>
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Bills List */}
            {bills.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Chưa có hóa đơn nào cho tháng này</p>
                        <p className="text-sm text-gray-500">Tính tiền để tạo hóa đơn và gửi email thông báo cho sinh viên</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bills.map((bill) => (
                        <Card key={bill.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">
                                        {bill.room.dormitory.name} - Phòng {bill.room.roomNumber}
                                    </CardTitle>
                                    {getStatusBadge(bill.status)}
                                </div>
                                <CardDescription>
                                    Tháng {bill.month}/{bill.year}
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

                                {bill.status === "PENDING" && (
                                    <div className="flex space-x-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdateStatus(bill.id, "PAID")}
                                            className="flex-1"
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Đã thanh toán
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(bill.id, "CANCELLED")}
                                        >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Hủy
                                        </Button>
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
