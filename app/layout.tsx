import { Inter } from 'next/font/google'
import './globals.css'
import type { ReactNode } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'OpenTalent - Internal Talent Graph',
  description: 'Internal talent graph platform for workforce intelligence',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
