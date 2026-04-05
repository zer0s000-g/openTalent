import React, { type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LocationsPage from '@/app/locations/page'

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

describe('LocationsPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
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
                },
              ],
            },
          },
        }),
      })

    render(<LocationsPage />)

    await screen.findByText('Indonesia Talent Footprint')
    expect((await screen.findAllByText('Jakarta')).length).toBeGreaterThan(0)
    await screen.findByText('James Smith')

    expect(screen.getAllByText('24 employees').length).toBeGreaterThan(0)
    expect(screen.getByText('City-based workforce distribution')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(5)
    })
  })
})
