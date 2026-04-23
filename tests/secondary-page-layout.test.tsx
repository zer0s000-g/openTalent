import React, { type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SkillsPage from '@/app/skills/page'
import AdminImportPage from '@/app/admin/import/page'

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: () => null,
  }),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/shared/card', () => ({
  Card: ({
    children,
    title,
    className,
  }: {
    children: ReactNode
    title?: string
    className?: string
  }) => (
    <div data-testid="card" data-classname={className}>
      {title ? <div>{title}</div> : null}
      {children}
    </div>
  ),
}))

vi.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div>loading</div>,
}))

vi.mock('@/components/shared/empty-state', () => ({
  EmptyState: ({
    title,
    description,
  }: {
    title: string
    description: string
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/shared/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/shared/alert', () => ({
  Alert: ({
    title,
    description,
  }: {
    title: string
    description: string
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

const mockFetch = vi.fn()

describe('Secondary page layout rails', () => {
  it('keeps the skills page intro and workspace on the same padded content rail', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          skills: [
            { name: 'Python', employeeCount: 29 },
            { name: 'React', employeeCount: 18 },
          ],
        },
      }),
    })

    vi.stubGlobal('fetch', mockFetch)

    const { container } = render(<SkillsPage />)

    await screen.findByText('Skills Directory')

    const rail = container.querySelector('.space-y-6.px-6')
    const workspaceGrid = container.querySelector('.grid.gap-6.lg\\:grid-cols-\\[340px_minmax\\(0\\,1fr\\)\\]')

    expect(rail).toBeTruthy()
    expect(workspaceGrid).toBeTruthy()

    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('keeps the import page intro and workspace on the same padded content rail', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        imports: [],
      }),
    })

    vi.stubGlobal('fetch', mockFetch)

    const { container } = render(<AdminImportPage />)

    expect(screen.getByText('Import Employees')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const rail = container.querySelector('.space-y-6.px-6')
    const workspaceGrid = container.querySelector('.grid.gap-6.lg\\:grid-cols-\\[minmax\\(0\\,1\\.7fr\\)_minmax\\(320px\\,0\\.8fr\\)\\]')

    expect(rail).toBeTruthy()
    expect(workspaceGrid).toBeTruthy()

    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })
})
