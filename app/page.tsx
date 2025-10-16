import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  // Check if user is logged in
  const user = await getCurrentUser()

  if (user) {
    // Redirect to appropriate dashboard
    if (user.role === "ADMIN") {
      redirect("/admin/dashboard")
    } else {
      redirect("/student/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Logo & Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">Hệ thống Đăng ký Ký túc xá</h1>
          <p className="text-2xl text-gray-700">Trường Đại học Sư phạm Kỹ thuật Hưng Yên</p>
          <p className="text-lg text-gray-600">UTEHY Dormitory Management System</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold mb-2">Đăng ký dễ dàng</h3>
            <p className="text-gray-600">Đăng ký phòng ký túc xá trực tuyến nhanh chóng</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">Quản lý hiệu quả</h3>
            <p className="text-gray-600">Theo dõi trạng thái đăng ký và thanh toán</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">Bảo mật cao</h3>
            <p className="text-gray-600">Thông tin được bảo mật và an toàn tuyệt đối</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Button asChild size="lg" className="text-lg px-8">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8 bg-transparent">
            <Link href="/register">Đăng ký tài khoản</Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-16 text-sm text-gray-500">
          <p>© 2025 Trường Đại học Sư phạm Kỹ thuật Hưng Yên</p>
          <p>Phát triển bởi Khoa Công nghệ Thông tin</p>
        </div>
      </div>
    </div>
  )
}
