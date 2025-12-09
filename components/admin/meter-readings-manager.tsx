"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getMeterReadingsAction, createMeterReadingAction } from "@/actions/utility"
import { getAllRoomsAction } from "@/actions/room"
import { exportMeterReadingsExcelAction, importMeterReadingsExcelAction, downloadMeterReadingsTemplateAction } from "@/actions/excel"
import { meterReadingSchema, type MeterReadingInput } from "@/lib/validations/utility"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus, Calendar, Download, Upload, FileSpreadsheet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { paginate } from "@/lib/utils"
import { Pagination } from "@/components/ui/pagination"

export function MeterReadingsManager() {
    const [readings, setReadings] = useState<any[]>([])
    const [rooms, setRooms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [currentPage, setCurrentPage] = useState(1)

    // Excel import/export states
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<any>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm<MeterReadingInput>({
        resolver: zodResolver(meterReadingSchema),
        defaultValues: {
            month: selectedMonth,
            year: selectedYear,
        },
    })

    useEffect(() => {
        loadReadings()
        loadRooms()
        setCurrentPage(1) // Reset to first page when month/year changes
    }, [selectedMonth, selectedYear])

    // Pagination logic
    const paginatedReadings = paginate(readings, currentPage, 10)
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
    }

    const loadReadings = async () => {
        setIsLoading(true)
        const result = await getMeterReadingsAction(selectedMonth, selectedYear)

        if (result.success) {
            setReadings(result.data)
        }

        setIsLoading(false)
    }

    const loadRooms = async () => {
        const result = await getAllRoomsAction()
        if (result.success) {
            setRooms(result.data)
        }
    }

    const onSubmit = async (data: MeterReadingInput) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const result = await createMeterReadingAction(data)

            if (result.success) {
                reset()
                setIsDialogOpen(false)
                await loadReadings()
            } else {
                setError(result.error || "Ghi chỉ số thất bại")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi ghi chỉ số")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Excel export function
    const handleExportExcel = async () => {
        const result = await exportMeterReadingsExcelAction(selectedMonth, selectedYear)

        if (result.success) {
            // Create download link
            const link = document.createElement('a')
            link.href = `data:${result.data?.mimeType};base64,${result.data?.buffer}`
            link.download = result.data?.fileName!!
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } else {
            setError(result.error || "Xuất Excel thất bại")
        }
    }

    // Excel import function
    const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        setImportResult(null)

        try {
            const buffer = await file.arrayBuffer()
            const base64 = Buffer.from(buffer).toString('base64')

            const result = await importMeterReadingsExcelAction(base64, selectedMonth, selectedYear)

            if (result.success) {
                setImportResult(result.data)
                await loadReadings() // Reload readings after import
            } else {
                setImportResult({ success: 0, failed: 1, errors: [result.error] })
            }
        } catch (error) {
            setImportResult({ success: 0, failed: 1, errors: ["Đã xảy ra lỗi khi đọc file"] })
        } finally {
            setIsImporting(false)
        }
    }

    // Download template function
    const handleDownloadTemplate = async () => {
        const result = await downloadMeterReadingsTemplateAction()

        if (result.success) {
            const link = document.createElement('a')
            link.href = `data:${result.data?.mimeType};base64,${result.data?.buffer}`
            link.download = result.data!.fileName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
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
                    <h2 className="text-2xl font-bold">Ghi chỉ số đồng hồ</h2>
                    <p className="text-gray-600">Quản lý chỉ số điện nước hàng tháng</p>
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

                    {/* Excel Actions */}
                    <div className="flex items-center space-x-2">
                        <Button className="cursor-pointer" variant="outline" onClick={handleDownloadTemplate}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Mẫu Excel
                        </Button>

                        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="cursor-pointer">
                                    <Download className="mr-2 h-4 w-4" />
                                    Nhập Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Nhập chỉ số từ Excel</DialogTitle>
                                    <DialogDescription>
                                        Chọn file Excel chứa chỉ số điện nước cho tháng {selectedMonth}/{selectedYear}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="excel-file">File Excel</Label>
                                        <input
                                            id="excel-file"
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleImportExcel}
                                            disabled={isImporting}
                                            className="flex cursor-pointer h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    {isImporting && (
                                        <div className="flex items-center space-x-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Đang nhập dữ liệu...</span>
                                        </div>
                                    )}

                                    {importResult && (
                                        <Alert variant={importResult.failed > 0 ? "destructive" : "default"}>
                                            <AlertDescription>
                                                <div className="space-y-2">
                                                    <p>Thành công: {importResult.success}</p>
                                                    <p>Thất bại: {importResult.failed}</p>
                                                    {importResult.errors.length > 0 && (
                                                        <div>
                                                            <p className="font-medium">Chi tiết lỗi:</p>
                                                            <ul className="list-disc list-inside text-sm">
                                                                {importResult.errors.map((error: string, index: number) => (
                                                                    <li key={index}>{error}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Button className="cursor-pointer" variant="outline" onClick={handleExportExcel}>
                            <Upload className="mr-2 h-4 w-4" />
                            Xuất Excel
                        </Button>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="cursor-pointer">
                                <Plus className="mr-2 h-4 w-4" />
                                Ghi chỉ số mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Ghi chỉ số đồng hồ</DialogTitle>
                                <DialogDescription>
                                    Nhập chỉ số điện nước cho phòng trong tháng {selectedMonth}/{selectedYear}
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="month">Tháng *</Label>
                                        <Select
                                            value={watch("month")?.toString()}
                                            onValueChange={(value) => setValue("month", parseInt(value))}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger>
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
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="year">Năm *</Label>
                                        <Select
                                            value={watch("year")?.toString()}
                                            onValueChange={(value) => setValue("year", parseInt(value))}
                                            disabled={isSubmitting}
                                        >
                                            <SelectTrigger>
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
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="roomId">Phòng *</Label>
                                    <Select
                                        value={watch("roomId")}
                                        onValueChange={(value) => setValue("roomId", value)}
                                        disabled={isSubmitting}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn phòng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rooms.map((room) => (
                                                <SelectItem key={room.id} value={room.id}>
                                                    {room.dormitory.name} - Phòng {room.roomNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.roomId && <p className="text-sm text-red-600">{errors.roomId.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="electricityReading">Chỉ số điện (kWh) *</Label>
                                        <input
                                            id="electricityReading"
                                            type="number"
                                            min="0"
                                            {...register("electricityReading", { valueAsNumber: true })}
                                            disabled={isSubmitting}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        {errors.electricityReading && <p className="text-sm text-red-600">{errors.electricityReading.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="waterReading">Chỉ số nước (m³) *</Label>
                                        <input
                                            id="waterReading"
                                            type="number"
                                            min="0"
                                            {...register("waterReading", { valueAsNumber: true })}
                                            disabled={isSubmitting}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                        {errors.waterReading && <p className="text-sm text-red-600">{errors.waterReading.message}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Ghi chú</Label>
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        {...register("notes")}
                                        disabled={isSubmitting}
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Ghi chú về chỉ số..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button className="cursor-pointer" type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                        Hủy
                                    </Button>
                                    <Button className="cursor-pointer" type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            "Ghi chỉ số"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Readings List */}
            {readings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Chưa có chỉ số nào cho tháng này</p>
                        <p className="text-sm text-gray-500">Bắt đầu ghi chỉ số để tính tiền điện nước</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedReadings.data.map((reading) => (
                            <Card key={reading.id}>
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {reading.room.dormitory.name} - Phòng {reading.room.roomNumber}
                                    </CardTitle>
                                    <CardDescription>
                                        Tháng {reading.month}/{reading.year}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Điện:</span>
                                            <span className="font-medium">{reading.electricityReading} kWh</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nước:</span>
                                            <span className="font-medium">{reading.waterReading} m³</span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-gray-600">
                                            Ghi nhận: {new Date(reading.recordedAt).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>

                                    {reading.notes && (
                                        <div className="pt-2 border-t">
                                            <p className="text-sm text-gray-600">{reading.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Pagination
                        currentPage={paginatedReadings.currentPage}
                        totalPages={paginatedReadings.totalPages}
                        onPageChange={handlePageChange}
                    />
                </>
            )}
        </div>
    )
}
