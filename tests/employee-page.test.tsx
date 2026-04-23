import React, { type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EmployeeProfilePage from '@/app/employee/[id]/page'

const mockFetch = vi.fn()
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/shared/card', () => ({
  Card: ({ children, title }: { children: ReactNode; title?: string }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
}))

vi.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div>loading</div>,
}))

vi.mock('@/components/shared/empty-state', () => ({
  EmptyState: ({
    title,
    description,
    action,
  }: {
    title: string
    description: string
    action?: ReactNode
  }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      {action}
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
    className,
  }: {
    children: ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

describe('EmployeeProfilePage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    mockPush.mockReset()
  })

  it('renders employee details with provenance metadata', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          employees: [
            {
              employee_id: 'EMP-002',
              name: 'Adi Putra',
              email: 'adi@airnav.co.id',
              title: 'Senior Data Analyst',
              department: 'Operations',
              location: 'Surabaya',
              hired_date: '2023-06-12',
              lastImportedAt: '2026-04-18T03:55:39.485Z',
              lastImportSource: 'reconcile.csv',
              lastImportBatchId: 'batch-123',
              manager: {
                employee_id: 'EMP-001',
                name: 'Jane Doe',
                title: 'Head of Ops',
              },
              directReports: [],
              skills: [{ name: 'Python' }],
              certifications: [],
              education: [],
              aspirations: [],
            },
          ],
        },
      }),
    })

    render(<EmployeeProfilePage params={{ id: 'EMP-002' }} />)

    await screen.findByText('Adi Putra')
    expect(screen.getByText('Data Provenance')).toBeInTheDocument()
    expect(screen.getByText('reconcile.csv')).toBeInTheDocument()
    expect(screen.getByText('batch-123')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('navigates back to the graph explorer with the router', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          employees: [
            {
              employee_id: 'EMP-002',
              name: 'Adi Putra',
              email: 'adi@airnav.co.id',
              title: 'Senior Data Analyst',
              department: 'Operations',
              location: 'Surabaya',
              hired_date: '2023-06-12',
              directReports: [],
              skills: [],
              certifications: [],
              education: [],
              aspirations: [],
            },
          ],
        },
      }),
    })

    render(<EmployeeProfilePage params={{ id: 'EMP-002' }} />)

    await screen.findByText('Adi Putra')
    fireEvent.click(screen.getByRole('button', { name: 'Back to Explorer' }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/graph')
    })
  })
})
