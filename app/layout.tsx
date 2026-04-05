import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import type { ReactNode } from 'react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata = {
  title: 'OpenTalent AirNav - Internal Talent Graph',
  description: 'Internal talent graph platform for workforce intelligence',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>{children}</body>
    </html>
  )
}
