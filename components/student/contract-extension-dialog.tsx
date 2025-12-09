"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { extendContractAction } from "@/actions/registration"
import { contractExtensionSchema, type ContractExtensionInput } from "@/lib/validations/registration"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2, Calendar, Home } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getNextSemester } from "@/lib/utils/semester"
import type { Registration, Room, Dormitory, Bed } from "@prisma/client"

type RegistrationWithRelations = Registration & {
    room: Room & {
        dormitory: Dormitory
    }
    bed: Bed | null
}

interface ContractExtensionDialogProps {
    registration: RegistrationWithRelations
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function ContractExtensionDialog({
    registration,
    open,
    onOpenChange,
    onSuccess
}: ContractExtensionDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<ContractExtensionInput>({
        resolver: zodResolver(contractExtensionSchema),
        defaultValues: {
            notes: "",
        },
    })

    const nextSemester = getNextSemester(registration.semester)

    const onSubmit = async (data: ContractExtensionInput) => {
        setIsSubmitting(true)
        setError(null)

        const result = await extendContractAction(data)

        if (result.success) {
            onSuccess()
            onOpenChange(false)
            form.reset()
        } else {
            setError(result.error || "Đã xảy ra lỗi khi gia hạn hợp đồng")
        }

        setIsSubmitting(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Gia hạn hợp đồng
                    </DialogTitle>
                    <DialogDescription>
                        Gia hạn hợp đồng cho học kỳ tiếp theo với cùng phòng hiện tại
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Current Registration Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <Home className="h-4 w-4 text-gray-600" />
                            <span className="font-medium">
                                {registration.room.dormitory.name} - Phòng {registration.room.roomNumber}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600">
                            Học kỳ hiện tại: {registration.semester.replace(/_/g, " ")}
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                            Học kỳ tiếp theo: {nextSemester.replace(/_/g, " ")}
                        </div>
                        {registration.bed && (
                            <div className="text-sm text-gray-600">
                                Giường: {registration.bed.bedNumber}
                            </div>
                        )}
                    </div>

                    {/* Extension Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ghi chú (tùy chọn)</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Nhập ghi chú cho phiếu gia hạn..."
                                                className="min-h-[80px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isSubmitting}
                                    className="cursor-pointer"
                                >
                                    Hủy
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Đang gia hạn...
                                        </>
                                    ) : (
                                        "Gia hạn hợp đồng"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
