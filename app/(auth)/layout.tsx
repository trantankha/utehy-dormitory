import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "UTEHY - Dormitory | Quản lý Ký túc xá trường Đại học Kỹ thuật Hưng Yên",
  description: "Đăng nhập hoặc đăng ký tài khoản",
  icons: {
    icon: "/logo-utehy.ico",
  },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
