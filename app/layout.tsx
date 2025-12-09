import type { Metadata } from 'next'
// import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'UTEHY - Dormitory | Quản lý Ký túc xá trường Đại học Kỹ thuật Hưng Yên',
  description: 'Hệ thống quản lý Ký túc xá trường Đại học Kỹ thuật Hưng Yên',
  icons: { icon: "/logo-utehy.ico" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
