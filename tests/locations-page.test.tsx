import React, { type ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LocationsPage from '@/app/locations/page'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
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

describe('LocationsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    push.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('loads the indonesia footprint and city detail for the leading hub', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            skills: [
              { name: 'Python', employeeCount: 29 },
              { name: 'Communication', employeeCount: 56 },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              departments: [
                { name: 'Engineering', count: 36 },
                { name: 'Operations', count: 16 },
              ],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationRoleOptions: [
              { name: 'Software Engineer', count: 20 },
              { name: 'Ops Manager', count: 10 },
            ],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getIndonesiaLocationFootprint: [
              {
                city: 'Jakarta',
                province: 'DKI Jakarta',
                lat: -6.2,
                lng: 106.8,
                employeeCount: 24,
                departments: [{ name: 'Engineering', count: 10 }],
                roles: [{ name: 'Software Engineer', count: 8 }],
                topSkills: [{ name: 'Communication', count: 12 }],
              },
              {
                city: 'Surabaya',
                province: 'East Java',
                lat: -7.2,
                lng: 112.7,
                employeeCount: 18,
                departments: [{ name: 'Operations', count: 7 }],
                roles: [{ name: 'Ops Manager', count: 5 }],
                topSkills: [{ name: 'Leadership', count: 6 }],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationDetail: {
              city: 'Jakarta',
              province: 'DKI Jakarta',
              lat: -6.2,
              lng: 106.8,
              employeeCount: 24,
              departments: [{ name: 'Engineering', count: 10 }],
              roles: [{ name: 'Software Engineer', count: 8 }],
              topSkills: [{ name: 'Communication', count: 12 }],
              employees: [
                {
                  employee_id: 'EMP0001',
                  name: 'James Smith',
                  title: 'Chief Executive Officer',
                  department: 'Executive',
                  location: 'Jakarta',
                  lastImportedAt: '2026-04-18T12:00:00.000Z',
                  lastImportSource: 'airnav.csv',
                },
              ],
            },
          },
        }),
      })

    render(<LocationsPage />)

    await screen.findByText('Indonesia Talent Footprint')
    expect(screen.getByText(/Location coverage reflects the latest import from/i)).toBeInTheDocument()
    expect((await screen.findAllByText('Jakarta')).length).toBeGreaterThan(0)
    await screen.findByText('James Smith')
    expect(screen.getAllByText(/Imported 4\/18\/2026/i).length).toBeGreaterThan(0)

    expect(screen.getAllByText('24 employees').length).toBeGreaterThan(0)
    expect(screen.getByText('City-based workforce distribution')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(6)
    })
  })

  it('opens the map in full screen mode and closes it with Escape', async () => {
    mockFetch
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
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationRoleOptions: [{ name: 'Software Engineer', count: 20 }],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getIndonesiaLocationFootprint: [
              {
                city: 'Jakarta',
                province: 'DKI Jakarta',
                lat: -6.2,
                lng: 106.8,
                employeeCount: 24,
                departments: [{ name: 'Engineering', count: 10 }],
                roles: [{ name: 'Software Engineer', count: 8 }],
                topSkills: [{ name: 'Communication', count: 12 }],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationDetail: {
              city: 'Jakarta',
              province: 'DKI Jakarta',
              lat: -6.2,
              lng: 106.8,
              employeeCount: 24,
              departments: [{ name: 'Engineering', count: 10 }],
              roles: [{ name: 'Software Engineer', count: 8 }],
              topSkills: [{ name: 'Communication', count: 12 }],
              employees: [],
            },
          },
        }),
      })

    render(<LocationsPage />)

    await screen.findByText('City-based workforce distribution')
    expect(screen.getByText('View full screen map')).toHaveAttribute('variant', 'primary')
    fireEvent.click(screen.getByText('View full screen map'))

    expect(await screen.findByText('Exit full screen')).toHaveAttribute('variant', 'primary')
    expect(screen.getByText('Press `Esc` to exit full screen mode.')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Exit full screen')).not.toBeInTheDocument()
    })
  })

  it('exposes a map-corner full screen affordance in the standard layout', async () => {
    mockFetch
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
            getDashboardStats: {
              departments: [{ name: 'Engineering', count: 36 }],
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationRoleOptions: [{ name: 'Software Engineer', count: 20 }],
          },
        }),
      })
      .mockResolvedValueOnce(createFreshnessResponse())
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getIndonesiaLocationFootprint: [
              {
                city: 'Jakarta',
                province: 'DKI Jakarta',
                lat: -6.2,
                lng: 106.8,
                employeeCount: 24,
                departments: [{ name: 'Engineering', count: 10 }],
                roles: [{ name: 'Software Engineer', count: 8 }],
                topSkills: [{ name: 'Communication', count: 12 }],
              },
            ],
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getLocationDetail: {
              city: 'Jakarta',
              province: 'DKI Jakarta',
              lat: -6.2,
              lng: 106.8,
              employeeCount: 24,
              departments: [{ name: 'Engineering', count: 10 }],
              roles: [{ name: 'Software Engineer', count: 8 }],
              topSkills: [{ name: 'Communication', count: 12 }],
              employees: [],
            },
          },
        }),
      })

    render(<LocationsPage />)

    await screen.findByText('City-based workforce distribution')
    expect(screen.getByLabelText('Open full screen map')).toBeInTheDocument()
  })
})
