"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getStudentUtilityBillsAction } from "@/actions/utility"
import { PaymentForm } from "@/components/student/payment-form"
import { formatCurrency } from "@/lib/utils"
import { CreditCard, FileText, Calendar, Home, Zap, Droplets } from "lucide-react"
import { BillStatus } from "@prisma/client"

interface UtilityBill {
    id: string
    roomId: string
    electricityUsage: number
    waterUsage: number
    electricityAmount: number
    waterAmount: number
    totalAmount: number
    status: BillStatus
    month: number
    year: number
    dueDate: string
    room: {
        roomNumber: string
        dormitory: {
            name: string
        }
    }
    createdAt: string
    paidAt?: string
    paidBy?: string
}

export default function StudentUtilityBillsPage() {
    const [bills, setBills] = useState<UtilityBill[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedBill, setSelectedBill] = useState<UtilityBill | null>(null)
    const [showPaymentForm, setShowPaymentForm] = useState<string | null>(null)

    useEffect(() => {
        loadBills()
    }, [])

    const loadBills = async () => {
        try {
            const result = await getStudentUtilityBillsAction()
            if (result && result.success) {
                setBills(result.data)
            }
        } catch (error) {
            console.error("Failed to load utility bills:", error)
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = (bill: UtilityBill) => {
        setSelectedBill(bill)
        setShowPaymentForm(bill.id)
    }

    const handlePaymentSuccess = () => {
        setShowPaymentForm(null)
        setSelectedBill(null)
        loadBills() // Reload bills to show updated status
    }

    // Group bills by month/year
    const groupedBills = useMemo(() => {
        const groups: { [key: string]: UtilityBill[] } = {}
        bills.forEach(bill => {
            const key = `${bill.year}-${bill.month.toString().padStart(2, '0')}`
            if (!groups[key]) groups[key] = []
            groups[key].push(bill)
        })
        return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
    }, [bills])

    const getStatusBadge = (status: BillStatus) => {
        switch (status) {
            case "PENDING":
                return <Badge variant="secondary">Chờ thanh toán</Badge>
            case "PAID":
                return <Badge variant="default" className="bg-green-500">Đã thanh toán</Badge>
            case "OVERDUE":
                return <Badge variant="destructive">Quá hạn</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const BillCard = ({ bill }: { bill: UtilityBill }) => (
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Home className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                Phòng {bill.room.roomNumber}
                            </h3>
                            <p className="text-sm text-gray-500">{bill.room.dormitory.name}</p>
                        </div>
                    </div>
                    {getStatusBadge(bill.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>Kỳ: Tháng {bill.month}/{bill.year}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                            Hạn: {new Date(bill.dueDate).toLocaleDateString('vi-VN')}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">Điện</span>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{bill.electricityUsage} kWh</div>
                                <div className="text-sm text-gray-600">{formatCurrency(bill.electricityAmount)}</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Droplets className="h-4 w-4 text-blue-500" />
                                <span className="text-sm">Nước</span>
                            </div>
                            <div className="text-right">
                                <div className="font-medium">{bill.waterUsage} m³</div>
                                <div className="text-sm text-gray-600">{formatCurrency(bill.waterAmount)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-gray-600">Tổng cộng</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(bill.totalAmount)}</div>
                    </div>

                    <div className="flex items-center gap-3">
                        {(bill.status === "PENDING" || bill.status === "OVERDUE") && (
                            <Button
                                onClick={() => handlePayment(bill)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                            >
                                <CreditCard className="h-4 w-4" />
                                Thanh toán
                            </Button>
                        )}
                        {bill.status === "PAID" && bill.paidAt && (
                            <div className="text-right text-sm text-gray-500">
                                <div className="font-medium text-green-600">✓ Đã thanh toán</div>
                                <div>{new Date(bill.paidAt).toLocaleDateString('vi-VN')}</div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Hóa đơn điện nước</h1>
                <p className="text-lg text-gray-600">Quản lý và thanh toán hóa đơn tiện ích của phòng</p>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : bills.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                            Không có hóa đơn nào
                        </h3>
                        <p className="text-gray-500">
                            Bạn chưa có hóa đơn điện nước nào cần thanh toán.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-8">
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="pending">Chờ thanh toán</TabsTrigger>
                        <TabsTrigger value="paid">Đã thanh toán</TabsTrigger>
                        <TabsTrigger value="overdue">Quá hạn</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-8">
                        {groupedBills.map(([monthKey, monthBills]) => {
                            const [year, month] = monthKey.split('-')
                            return (
                                <div key={monthKey} className="space-y-4">
                                    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                                        Tháng {parseInt(month)}/{year}
                                    </h2>
                                    <div className="grid gap-6">
                                        {monthBills.map(bill => (
                                            <BillCard key={bill.id} bill={bill} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </TabsContent>

                    <TabsContent value="pending" className="space-y-8">
                        {groupedBills
                            .map(([monthKey, monthBills]) => ({
                                monthKey,
                                bills: monthBills.filter(b => b.status === "PENDING")
                            }))
                            .filter(({ bills }) => bills.length > 0)
                            .map(({ monthKey, bills }) => {
                                const [year, month] = monthKey.split('-')
                                return (
                                    <div key={monthKey} className="space-y-4">
                                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                                            Tháng {parseInt(month)}/{year}
                                        </h2>
                                        <div className="grid gap-6">
                                            {bills.map(bill => (
                                                <BillCard key={bill.id} bill={bill} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                    </TabsContent>

                    <TabsContent value="paid" className="space-y-8">
                        {groupedBills
                            .map(([monthKey, monthBills]) => ({
                                monthKey,
                                bills: monthBills.filter(b => b.status === "PAID")
                            }))
                            .filter(({ bills }) => bills.length > 0)
                            .map(({ monthKey, bills }) => {
                                const [year, month] = monthKey.split('-')
                                return (
                                    <div key={monthKey} className="space-y-4">
                                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                                            Tháng {parseInt(month)}/{year}
                                        </h2>
                                        <div className="grid gap-6">
                                            {bills.map(bill => (
                                                <BillCard key={bill.id} bill={bill} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                    </TabsContent>

                    <TabsContent value="overdue" className="space-y-8">
                        {groupedBills
                            .map(([monthKey, monthBills]) => ({
                                monthKey,
                                bills: monthBills.filter(b => b.status === "OVERDUE")
                            }))
                            .filter(({ bills }) => bills.length > 0)
                            .map(({ monthKey, bills }) => {
                                const [year, month] = monthKey.split('-')
                                return (
                                    <div key={monthKey} className="space-y-4">
                                        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
                                            Tháng {parseInt(month)}/{year}
                                        </h2>
                                        <div className="grid gap-6">
                                            {bills.map(bill => (
                                                <BillCard key={bill.id} bill={bill} />
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                    </TabsContent>
                </Tabs>
            )}

            <Dialog open={showPaymentForm === selectedBill?.id} onOpenChange={(open) => !open && setShowPaymentForm(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Thanh toán hóa đơn điện nước</DialogTitle>
                    </DialogHeader>
                    {selectedBill && (
                        <PaymentForm
                            type="utility-bill"
                            entityId={selectedBill.id}
                            amount={selectedBill.totalAmount}
                            description={`Thanh toán hóa đơn điện nước phòng ${selectedBill.room.roomNumber} tháng ${selectedBill.month}/${selectedBill.year}`}
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => {
                                setShowPaymentForm(null)
                                setSelectedBill(null)
                            }}
                            inModal={true}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
