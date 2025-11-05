"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getCurrentUtilityRatesAction, createUtilityRateAction } from "@/actions/utility"
import { utilityRateSchema, type UtilityRateInput } from "@/lib/validations/utility"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function UtilityRatesManager() {
    const [rates, setRates] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<UtilityRateInput>({
        resolver: zodResolver(utilityRateSchema),
    })

    useEffect(() => {
        loadRates()
    }, [])

    const loadRates = async () => {
        setIsLoading(true)
        const result = await getCurrentUtilityRatesAction()

        if (result.success) {
            setRates(result.data)
        }

        setIsLoading(false)
    }

    const onSubmit = async (data: UtilityRateInput) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const result = await createUtilityRateAction(data)

            if (result.success) {
                reset()
                setIsDialogOpen(false)
                await loadRates()
            } else {
                setError(result.error || "Tạo biểu giá thất bại")
            }
        } catch (err) {
            setError("Đã xảy ra lỗi khi tạo biểu giá")
        } finally {
            setIsSubmitting(false)
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
                    <h2 className="text-2xl font-bold">Biểu giá điện nước</h2>
                    <p className="text-gray-600">Quản lý đơn giá điện và nước</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm biểu giá mới
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Thêm biểu giá mới</DialogTitle>
                            <DialogDescription>
                                Tạo biểu giá điện nước mới. Biểu giá cũ sẽ tự động kết thúc hiệu lực.
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
                                    <Label htmlFor="electricityRate">Đơn giá điện (đ/kWh) *</Label>
                                    <input
                                        id="electricityRate"
                                        type="number"
                                        step="0.01"
                                        {...register("electricityRate", { valueAsNumber: true })}
                                        disabled={isSubmitting}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.electricityRate && <p className="text-sm text-red-600">{errors.electricityRate.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="waterRate">Đơn giá nước (đ/m³) *</Label>
                                    <input
                                        id="waterRate"
                                        type="number"
                                        step="0.01"
                                        {...register("waterRate", { valueAsNumber: true })}
                                        disabled={isSubmitting}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {errors.waterRate && <p className="text-sm text-red-600">{errors.waterRate.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="effectiveFrom">Ngày bắt đầu áp dụng *</Label>
                                <input
                                    id="effectiveFrom"
                                    type="datetime-local"
                                    {...register("effectiveFrom")}
                                    disabled={isSubmitting}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                {errors.effectiveFrom && <p className="text-sm text-red-600">{errors.effectiveFrom.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Mô tả</Label>
                                <textarea
                                    id="description"
                                    rows={3}
                                    {...register("description")}
                                    disabled={isSubmitting}
                                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Mô tả biểu giá..."
                                />
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        "Tạo biểu giá"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Current Rates */}
            {rates.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-gray-600 mb-4">Chưa có biểu giá nào</p>
                        <p className="text-sm text-gray-500">Tạo biểu giá đầu tiên để bắt đầu quản lý điện nước</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rates.map((rate) => (
                        <Card key={rate.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">Biểu giá hiện tại</CardTitle>
                                <CardDescription>
                                    Hiệu lực từ: {new Date(rate.effectiveFrom).toLocaleDateString("vi-VN")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Điện:</span>
                                        <span className="font-medium">{Number(rate.electricityRate).toLocaleString("vi-VN")} đ/kWh</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Nước:</span>
                                        <span className="font-medium">{Number(rate.waterRate).toLocaleString("vi-VN")} đ/m³</span>
                                    </div>
                                </div>

                                {rate.description && (
                                    <div className="pt-2 border-t">
                                        <p className="text-sm text-gray-600">{rate.description}</p>
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
