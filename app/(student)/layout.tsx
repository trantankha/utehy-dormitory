import type React from "react"
import type { Metadata } from "next"
import { requireAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudentNav } from "@/components/layouts/student-nav"

export const metadata: Metadata = {
  title: "Sinh viên - UTEHY Dormitory",
  description: "Cổng thông tin sinh viên",
}

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require student authentication
  const user = await requireAuth(["STUDENT"]).catch(() => null)

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNav user={user} />
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
