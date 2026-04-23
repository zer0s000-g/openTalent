import React, { type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SkillsPage from '@/app/skills/page'

const { searchParamState } = vi.hoisted(() => ({
  searchParamState: { skill: null as string | null },
}))

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'skill' ? searchParamState.skill : null),
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

vi.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
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
      <p>{title}</p>
      <p>{description}</p>
    </div>
  ),
}))

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

const mockFetch = vi.fn()

function createFreshnessResponse() {
  return {
    json: async () => ({
      data: {
        getDataFreshnessSummary: {
          employeeCount: 120,
          employeesWithImportMetadata: 118,
          totalImportBatches: 4,
          latestBatchId: 'batch-004',
          latestImportSource: 'airnav.csv',
          latestImportedAt: '2026-04-18T12:00:00.000Z',
          latestWarningCount: 1,
          latestRowsToCreate: 2,
          latestRowsToUpdate: 8,
        },
      },
    }),
  }
}

describe('SkillsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    push.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    searchParamState.skill = null
  })

  it('loads skills and shows employees when a skill is selected', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [
              { name: 'Decision Making', employeeCount: 56 },
              { name: 'Communication', employeeCount: 44 },
            ],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEmployeesBySkill: [
              {
                employee_id: 'EMP0001',
                name: 'James Smith',
                title: 'Chief Executive Officer',
                department: 'Executive',
                lastImportedAt: '2026-04-18T12:00:00.000Z',
                lastImportSource: 'airnav.csv',
              },
              {
                employee_id: 'EMP0002',
                name: 'Mary Johnson',
                title: 'VP Engineering',
                department: 'Engineering',
                lastImportedAt: '2026-04-18T12:00:00.000Z',
                lastImportSource: 'airnav.csv',
              },
            ],
          },
        }),
      })

    render(<SkillsPage />)

    await screen.findByText('All Skills (2)')
    expect(screen.getByText(/Skill coverage reflects the latest import from/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /decision making/i }))

    await screen.findByText('James Smith')
    expect(screen.getByText('Mary Johnson')).toBeInTheDocument()
    expect(screen.getByText('56 employees')).toBeInTheDocument()
  })

  it('surfaces a detail request error instead of showing a false empty state', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [{ name: 'Decision Making', employeeCount: 56 }],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          errors: [{ message: 'Expected parameter(s): limit' }],
        }),
      })

    render(<SkillsPage />)

    await screen.findByText('All Skills (1)')
    fireEvent.click(screen.getByRole('button', { name: /decision making/i }))

    await waitFor(() => {
      expect(screen.getByText('Unable to load employees')).toBeInTheDocument()
    })
    expect(screen.queryByText('No employees found')).not.toBeInTheDocument()
  })

  it('deep-links a selected skill from the header search into the directory view', async () => {
    searchParamState.skill = 'Python'

    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [
              { name: 'Python', employeeCount: 29 },
              { name: 'React', employeeCount: 18 },
            ],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEmployeesBySkill: [
              {
                employee_id: 'EMP0042',
                name: 'Priya Tan',
                title: 'Senior Data Scientist',
                department: 'Data Science',
                lastImportedAt: '2026-04-18T12:00:00.000Z',
                lastImportSource: 'airnav.csv',
              },
            ],
          },
        }),
      })

    render(<SkillsPage />)

    await screen.findByText('Python')
    await screen.findByText('Priya Tan')
    expect(screen.getByText('29 employees')).toBeInTheDocument()
  })
})
