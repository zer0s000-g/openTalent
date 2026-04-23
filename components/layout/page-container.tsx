import React, { type ReactNode } from 'react'

export function PageContainer({
  children,
  sidebarCollapsed,
}: {
  children: ReactNode
  sidebarCollapsed: boolean
}) {
  return (
    <div className={`min-h-screen flex-1 transition-[padding] duration-300 ${sidebarCollapsed ? 'pl-0' : 'pl-[18rem]'}`}>
      <main className="min-h-screen px-6 pb-8">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6">
          {children}
        </div>
      </main>
    </div>
  )
}
