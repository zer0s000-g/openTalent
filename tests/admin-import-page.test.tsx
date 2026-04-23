import React, { type ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminImportPage from '@/app/admin/import/page'

const mockFetch = vi.fn()
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
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
    <section className={className}>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
}))

vi.mock('@/components/shared/button', () => ({
  Button: ({
    children,
    onClick,
    className,
    disabled,
  }: {
    children: ReactNode
    onClick?: () => void
    className?: string
    disabled?: boolean
  }) => (
    <button type="button" onClick={onClick} className={className} disabled={disabled}>
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
    description?: string
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

describe('AdminImportPage import history', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    mockPush.mockReset()
    mockRefresh.mockReset()
  })

  it('loads and displays recent import batches', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        imports: [
          {
            id: 'batch-123',
            source: 'csv',
            filename: 'airnav-team.csv',
            importedAt: '2026-04-18T08:20:00.000Z',
            actorName: 'Local Admin',
            actorEmail: 'local.admin@airnav.co.id',
            totalRows: 10,
            validRows: 10,
            invalidRows: 0,
            rowsToCreate: 3,
            rowsToUpdate: 7,
            warningCount: 1,
            employeeCount: 10,
            issues: [
              {
                row: 6,
                employee_id: 'EMP-006',
                message: 'skills column was provided but no valid skills were parsed',
                severity: 'warning',
              },
            ],
          },
        ],
      }),
    })

    render(<AdminImportPage />)

    await screen.findByText('Recent Import History')
    expect(await screen.findByText('airnav-team.csv')).toBeInTheDocument()
    expect(screen.getByText('10 employees')).toBeInTheDocument()
    expect(screen.getByText('batch-123')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('skills column was provided but no valid skills were parsed')),
    ).toBeInTheDocument()
  })
})
