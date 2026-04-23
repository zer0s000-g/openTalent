import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { PageContainer } from '@/components/layout/page-container'

vi.mock('next/navigation', () => ({
  usePathname: () => '/graph',
  useRouter: () => ({ push: () => undefined }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/layout/unified-command-search', () => ({
  UnifiedCommandSearch: () => <div>Unified Command Search</div>,
}))

describe('Layout shell', () => {
  it('fully hides the sidebar when collapsed and does not render an in-sidebar toggle button', () => {
    const { container } = render(<Sidebar collapsed />)
    const aside = container.querySelector('aside')

    expect(aside?.className).toContain('-translate-x-full')
    expect(aside?.className).toContain('pointer-events-none')
    expect(screen.queryByLabelText(/show sidebar|hide sidebar/i)).not.toBeInTheDocument()
  })

  it('keeps the reveal toggle in the header with the correct accessible label', () => {
    render(<Header sidebarCollapsed onToggleSidebar={() => undefined} />)

    expect(screen.getByLabelText('Show sidebar')).toBeInTheDocument()
  })

  it('removes reserved rail width from the page container when the sidebar is collapsed', () => {
    const { container, rerender } = render(
      <PageContainer sidebarCollapsed>
        <div>content</div>
      </PageContainer>,
    )

    expect(container.firstChild).toHaveClass('pl-0')

    rerender(
      <PageContainer sidebarCollapsed={false}>
        <div>content</div>
      </PageContainer>,
    )

    expect(container.firstChild).toHaveClass('pl-[18rem]')
  })
})
