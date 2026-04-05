import { Sidebar } from './sidebar'
import { PageContainer } from './page-container'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <PageContainer>{children}</PageContainer>
    </div>
  )
}
