'use client'

import { useEffect, useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { PageContainer } from './page-container'
import type { ReactNode } from 'react'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const savedPreference = window.localStorage.getItem('opentalent.sidebarCollapsed')
    if (savedPreference === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('opentalent.sidebarCollapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="flex min-h-screen bg-transparent">
      <Sidebar collapsed={sidebarCollapsed} />
      <PageContainer sidebarCollapsed={sidebarCollapsed}>
        <Header
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
        />
        {children}
      </PageContainer>
    </div>
  )
}
