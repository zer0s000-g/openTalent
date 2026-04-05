import { Header } from './header'
import { Sidebar } from './sidebar'
import { PageContainer } from './page-container'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <PageContainer>{children}</PageContainer>
    </div>
  )
}
