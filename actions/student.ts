"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateStudentProfileSchema, type UpdateStudentProfileInput } from "@/lib/validations/student"

export async function getStudentProfileAction() {
    try {
        const user = await requireAuth(["STUDENT"])

        const student = await prisma.student.findUnique({
            where: { id: user.studentId },
            include: {
                user: {
                    select: {
                        email: true,
                        createdAt: true,
                    },
                },
            },
        })

        if (!student) {
            return {
                success: false,
                error: "Không tìm thấy thông tin sinh viên",
            }
        }

        return {
            success: true,
            data: student,
        }
    } catch (error) {
        console.error("Error getting student profile:", error)
        return {
            success: false,
            error: "Có lỗi xảy ra khi tải thông tin sinh viên",
        }
    }
}

export async function updateStudentProfileAction(formData: UpdateStudentProfileInput) {
    try {
        const user = await requireAuth(["STUDENT"])

        // Validate input data
        const validatedData = updateStudentProfileSchema.parse(formData)

        // Convert dateOfBirth string to Date object
        const dateOfBirth = new Date(validatedData.dateOfBirth)

        // Update student profile
        await prisma.student.update({
            where: { id: user.studentId },
            data: {
                fullName: validatedData.fullName,
                gender: validatedData.gender,
                dateOfBirth,
                phoneNumber: validatedData.phoneNumber,
                major: validatedData.major,
                course: validatedData.course,
                address: validatedData.address,
                updatedAt: new Date(),
            },
        })

        // Revalidate the profile page
        revalidatePath("/student/profile")

        return {
            success: true,
            message: "Cập nhật thông tin thành công",
        }
    } catch (error) {
        console.error("Error updating student profile:", error)

        if (error instanceof Error) {
            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: false,
            error: "Có lỗi xảy ra khi cập nhật thông tin",
        }
    }
}
