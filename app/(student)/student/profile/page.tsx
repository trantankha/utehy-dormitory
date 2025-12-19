import { requireAuth } from "@/lib/auth"
import { getStudentProfileAction } from "@/actions/student"
import { ProfileForm } from "@/components/student/profile-form"
import type { Student, User } from "@prisma/client"

type StudentWithUser = Student & {
    user: Pick<User, "email" | "createdAt">
}

export default async function StudentProfilePage() {
    // Get student profile data
    const result = await getStudentProfileAction()

    if (!result.success) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi tải trang</h1>
                    <p className="text-gray-600">{result.error}</p>
                </div>
            </div>
        )
    }

    const student = result.data as StudentWithUser

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
                    <p className="text-gray-600 mt-2">
                        Quản lý và cập nhật thông tin cá nhân của bạn
                    </p>
                </div>

                <ProfileForm student={student} />
            </div>
        </div>
    )
}
