import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Xác thực - UTEHY Dormitory",
  description: "Đăng nhập hoặc đăng ký tài khoản",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
