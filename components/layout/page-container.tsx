import type { ReactNode } from 'react'

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <main className="px-8 py-6">{children}</main>
    </div>
  )
}
