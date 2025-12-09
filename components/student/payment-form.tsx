"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createPaymentSchema, type CreatePaymentInput } from "@/lib/validations/payment"
import { createPaymentAction, createUtilityBillPaymentAction } from "@/actions/payment"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CreditCard, QrCode, Banknote } from "lucide-react"
import { formatAmount, getPaymentMethodName } from "@/lib/payment"
type PaymentMethod = "VNPAY_QR" | "VNPAY_ATM" | "VNPAY_BANK" | "CASH"

interface PaymentFormProps {
    type: "registration" | "utility-bill"
    entityId: string
    amount: number
    description: string
    onSuccess?: () => void
    onCancel?: () => void
    inModal?: boolean
}

export function PaymentForm({ type, entityId, amount, description, onSuccess, onCancel, inModal }: PaymentFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<CreatePaymentInput>({
        resolver: zodResolver(createPaymentSchema),
        defaultValues: {
            ...(type === "registration" ? { registrationId: entityId } : { utilityBillId: entityId }),
            amount,
            method: "VNPAY_QR",
            orderInfo: description,
            notes: "",
        },
    })

    const selectedMethod = form.watch("method")

    const onSubmit = async (data: CreatePaymentInput) => {
        setIsLoading(true)
        setError(null)

        try {
            const result = type === "utility-bill"
                ? await createUtilityBillPaymentAction(data)
                : await createPaymentAction(data)

            if (result.success) {
                if (result.data?.paymentUrl) {
                    // Redirect to VNPay
                    window.location.href = result.data.paymentUrl
                } else {
                    // Cash payment - show success message
                    setPaymentUrl(null)
                    onSuccess?.()
                }
            } else {
                setError(result.error || "Có lỗi xảy ra khi tạo thanh toán")
            }
        } catch (error) {
            setError("Có lỗi xảy ra khi tạo thanh toán")
        } finally {
            setIsLoading(false)
        }
    }

    const getMethodIcon = (method: PaymentMethod) => {
        switch (method) {
            case "VNPAY_QR":
                return <QrCode className="h-4 w-4" />
            case "VNPAY_ATM":
            case "VNPAY_BANK":
                return <CreditCard className="h-4 w-4" />
            case "CASH":
                return <Banknote className="h-4 w-4" />
            default:
                return <CreditCard className="h-4 w-4" />
        }
    }

    if (inModal) {
        return (
            <>
                {error && (
                    <Alert className="mb-4" variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Amount */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tiền thanh toán</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Nhập số tiền"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            disabled
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method */}
                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phương thức thanh toán</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn phương thức thanh toán" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="VNPAY_QR">
                                                <div className="flex items-center gap-2">
                                                    <QrCode className="h-4 w-4" />
                                                    VNPay QR Code
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="VNPAY_ATM">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    VNPay ATM
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="VNPAY_BANK">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    VNPay Internet Banking
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="CASH">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4" />
                                                    Tiền mặt (thanh toán tại chỗ)
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Order Info */}
                        <FormField
                            control={form.control}
                            name="orderInfo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thông tin đơn hàng</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập thông tin đơn hàng" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập ghi chú nếu có"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method Info */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                {getMethodIcon(selectedMethod)}
                                <span className="font-medium">{getPaymentMethodName(selectedMethod)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {selectedMethod === "VNPAY_QR" && "Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng."}
                                {selectedMethod === "VNPAY_ATM" && "Thanh toán tại máy ATM của các ngân hàng liên kết VNPay."}
                                {selectedMethod === "VNPAY_BANK" && "Thanh toán trực tuyến qua Internet Banking."}
                                {selectedMethod === "CASH" && "Thanh toán bằng tiền mặt tại phòng quản lý ký túc xá."}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 cursor-pointer"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 cursor-pointer"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedMethod === "CASH" ? "Xác nhận thanh toán" : "Thanh toán ngay"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </>
        )
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {type === "registration" ? "Thanh toán ký túc xá" : "Thanh toán hóa đơn điện nước"}
                </CardTitle>
                <CardDescription>
                    {description} - Số tiền: <Badge variant="secondary">{formatAmount(amount)}</Badge>
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert className="mb-4" variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Amount */}
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Số tiền thanh toán</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="Nhập số tiền"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                            disabled
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method */}
                        <FormField
                            control={form.control}
                            name="method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phương thức thanh toán</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn phương thức thanh toán" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="VNPAY_QR">
                                                <div className="flex items-center gap-2">
                                                    <QrCode className="h-4 w-4" />
                                                    VNPay QR Code
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="VNPAY_ATM">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    VNPay ATM
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="VNPAY_BANK">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    VNPay Internet Banking
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="CASH">
                                                <div className="flex items-center gap-2">
                                                    <Banknote className="h-4 w-4" />
                                                    Tiền mặt (thanh toán tại chỗ)
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Order Info */}
                        <FormField
                            control={form.control}
                            name="orderInfo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thông tin đơn hàng</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập thông tin đơn hàng" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Notes */}
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập ghi chú nếu có"
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Payment Method Info */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                {getMethodIcon(selectedMethod)}
                                <span className="font-medium">{getPaymentMethodName(selectedMethod)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {selectedMethod === "VNPAY_QR" && "Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng."}
                                {selectedMethod === "VNPAY_ATM" && "Thanh toán tại máy ATM của các ngân hàng liên kết VNPay."}
                                {selectedMethod === "VNPAY_BANK" && "Thanh toán trực tuyến qua Internet Banking."}
                                {selectedMethod === "CASH" && "Thanh toán bằng tiền mặt tại phòng quản lý ký túc xá."}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isLoading}
                                className="flex-1 cursor-pointer"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 cursor-pointer"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {selectedMethod === "CASH" ? "Xác nhận thanh toán" : "Thanh toán ngay"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
