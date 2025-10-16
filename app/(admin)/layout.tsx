import type React from "react"
import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminNav } from "@/components/layouts/admin-nav"

export const metadata: Metadata = {
  title: "Quản trị - UTEHY Dormitory",
  description: "Trang quản trị hệ thống",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require admin authentication
  const user = await requireAuth(["ADMIN"]).catch(() => null)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
