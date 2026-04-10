import React, { type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GraphExplorerPage from '@/app/graph/page'

const { graphSearchParamState } = vi.hoisted(() => ({
  graphSearchParamState: {
    mode: null as string | null,
    employeeId: null as string | null,
    department: null as string | null,
    skill: null as string | null,
  },
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'mode') return graphSearchParamState.mode
      if (key === 'employeeId') return graphSearchParamState.employeeId
      if (key === 'department') return graphSearchParamState.department
      if (key === 'skill') return graphSearchParamState.skill
      return null
    },
  }),
}))

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
    ...props
  }: {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
    [key: string]: unknown
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('@/components/shared/card', () => ({
  Card: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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

vi.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}))

vi.mock('@/components/graph/graph-canvas', async () => {
  const ReactModule = await import('react')
  return {
    GraphCanvas: ReactModule.forwardRef(function MockGraphCanvas(_, _ref) {
      return <div data-testid="graph-canvas" />
    }),
  }
})

vi.mock('@/components/graph/employee-detail-drawer', () => ({
  EmployeeDetailDrawer: () => <div data-testid="employee-detail-drawer" />,
}))

vi.mock('@/components/graph/skill-insight-panel', () => ({
  SkillInsightPanel: ({
    skillName,
    loading,
  }: {
    skillName: string | null
    loading: boolean
  }) => (
    <div>
      {loading ? 'Loading skill intelligence' : null}
      {!loading && !skillName ? 'Choose a skill cluster' : null}
    </div>
  ),
}))

const mockFetch = vi.fn()

describe('GraphExplorerPage skill flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    graphSearchParamState.mode = null
    graphSearchParamState.employeeId = null
    graphSearchParamState.department = null
    graphSearchParamState.skill = null
  })

  it('boots into the enterprise map and shows full-company summary metrics', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [
                { name: 'Engineering', count: 36 },
                { name: 'Sales', count: 28 },
              ],
            },
          },
        }),
      })
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
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
                },
                {
                  id: 'emp-2',
                  labels: ['Employee'],
                  properties: { name: 'Betty Johnson', employee_id: 'EMP0002', department: 'Sales' },
                },
                {
                  id: 'dept-1',
                  labels: ['Department'],
                  properties: { name: 'Engineering' },
                },
                {
                  id: 'skill-1',
                  labels: ['Skill'],
                  properties: { name: 'Python' },
                },
              ],
              relationships: [
                { start: { id: 'emp-2' }, end: { id: 'emp-1' }, type: 'REPORTS_TO' },
                { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
                { start: { id: 'emp-1' }, end: { id: 'skill-1' }, type: 'HAS_SKILL' },
              ],
            },
          },
        }),
      })

    render(<GraphExplorerPage />)

    await screen.findByText('Enterprise Map')
    await screen.findByText('All 200 employees in one view')
    await screen.findByText('Live workforce map')

    expect(screen.getByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('Departments')).toBeInTheDocument()
    expect(screen.getByText('Shared skills')).toBeInTheDocument()
    expect(screen.getByText('Reporting links')).toBeInTheDocument()
    expect(screen.getByText('Top shared skills')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)
  })

  it('loads skill options during bootstrap and shows the empty skill state without a false loading spinner', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
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
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001' },
                },
              ],
              relationships: [],
            },
          },
        }),
      })

    render(<GraphExplorerPage />)

    await screen.findByText('Explore By')

    fireEvent.click(screen.getByRole('button', { name: /skill see where expertise clusters/i }))

    const select = await screen.findByRole('combobox')

    await waitFor(() => {
      const optionLabels = Array.from(select.querySelectorAll('option')).map((option) => option.textContent)
      expect(optionLabels).toContain('Python (29)')
      expect(optionLabels).toContain('React (18)')
    })

    expect(screen.getAllByText('Choose a skill cluster').length).toBeGreaterThan(0)
    expect(screen.queryByText('Loading skill intelligence')).not.toBeInTheDocument()
  })

  it('reloads the enterprise map after switching into a focused department graph', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
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
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
                },
                {
                  id: 'dept-1',
                  labels: ['Department'],
                  properties: { name: 'Engineering' },
                },
              ],
              relationships: [
                { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDepartmentSubgraph: {
              center: {
                id: 'dept-1',
                labels: ['Department'],
                properties: { name: 'Engineering' },
              },
              nodes: [
                {
                  id: 'dept-1',
                  labels: ['Department'],
                  properties: { name: 'Engineering' },
                },
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
                },
              ],
              relationships: [
                { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Engineering' },
                },
                {
                  id: 'dept-1',
                  labels: ['Department'],
                  properties: { name: 'Engineering' },
                },
                {
                  id: 'skill-1',
                  labels: ['Skill'],
                  properties: { name: 'Python' },
                },
              ],
              relationships: [
                { start: { id: 'emp-1' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
                { start: { id: 'emp-1' }, end: { id: 'skill-1' }, type: 'HAS_SKILL' },
              ],
            },
          },
        }),
      })

    render(<GraphExplorerPage />)

    await screen.findByText('Explore By')

    fireEvent.click(screen.getByRole('button', { name: /department review organizational structure/i }))

    const select = await screen.findByRole('combobox')
    fireEvent.change(select, { target: { value: 'Engineering' } })
    fireEvent.click(screen.getByRole('button', { name: /load department network/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(4)
    })

    fireEvent.click(screen.getByRole('button', { name: /enterprise see the full workforce map/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })

    const lastCall = mockFetch.mock.calls.at(-1)
    expect(String(lastCall?.[1]?.body)).toContain('getEnterpriseGraphOverview')
  })

  it('deep-links a department result into the department graph view', async () => {
    graphSearchParamState.department = 'Engineering'

    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [{ name: 'Python', employeeCount: 29 }],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Executive' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Executive' },
                },
              ],
              relationships: [],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDepartmentSubgraph: {
              center: {
                id: 'dept-1',
                labels: ['Department'],
                properties: { name: 'Engineering' },
              },
              nodes: [
                {
                  id: 'dept-1',
                  labels: ['Department'],
                  properties: { name: 'Engineering' },
                },
                {
                  id: 'emp-2',
                  labels: ['Employee'],
                  properties: { name: 'Mary Johnson', employee_id: 'EMP0002', department: 'Engineering' },
                },
              ],
              relationships: [
                { start: { id: 'emp-2' }, end: { id: 'dept-1' }, type: 'BELONGS_TO_DEPARTMENT' },
              ],
            },
          },
        }),
      })

    render(<GraphExplorerPage />)

    await screen.findByText('Engineering')

    expect(mockFetch).toHaveBeenCalledTimes(4)
    expect(String(mockFetch.mock.calls.at(-1)?.[1]?.body)).toContain('getDepartmentSubgraph')
  })

  it('uses the same fullscreen entry and exit pattern as the location map', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [{ name: 'Python', employeeCount: 29 }],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getEnterpriseGraphOverview: {
              center: {
                id: 'emp-1',
                labels: ['Employee'],
                properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Executive' },
              },
              nodes: [
                {
                  id: 'emp-1',
                  labels: ['Employee'],
                  properties: { name: 'James Smith', employee_id: 'EMP0001', department: 'Executive' },
                },
              ],
              relationships: [],
            },
          },
        }),
      })

    render(<GraphExplorerPage />)

    await screen.findByText('Interactive exploration canvas')
    expect(screen.getByText('View full screen graph')).toHaveAttribute('variant', 'primary')
    expect(screen.getByLabelText('Open full screen graph')).toBeInTheDocument()

    fireEvent.click(screen.getByText('View full screen graph'))

    expect(await screen.findByText('Exit full screen')).toHaveAttribute('variant', 'primary')
    expect(screen.getByText('Press `Esc` to exit full screen mode.')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Exit full screen')).not.toBeInTheDocument()
    })
  })
})
