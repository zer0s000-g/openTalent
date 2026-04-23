import React, { type ReactNode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardPage from '@/app/dashboard/page'

vi.mock('@/components/layout/app-layout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/shared/card', () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <section className={className}>{children}</section>
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

vi.mock('@/components/shared/loading-spinner', () => ({
  LoadingSpinner: () => <div>loading</div>,
}))

vi.mock('@/components/shared/empty-state', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
    </div>
  ),
}))

const mockFetch = vi.fn()

describe('DashboardPage leadership snapshot', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('shows the simplified leadership snapshot instead of raw graph counts', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getDashboardStats: {
              employeesAggregate: { count: 200 },
              skillsAggregate: { count: 97 },
              departments: [{ name: 'Engineering', count: 36 }],
              locations: [{ name: 'Jakarta', count: 33 }],
              topSkills: [{ name: 'Leadership', count: 44 }],
              managerCount: 42,
              avgSpanOfControl: 4.7,
              avgSkillsPerEmployee: 5.9,
            },
          },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: {
            getOrganizationOverview: {
              center: {
                id: 'center',
                labels: ['Employee'],
                properties: { name: 'James Smith', title: 'Chief Executive Officer' },
              },
              nodes: [
                { id: 'center', labels: ['Employee'], properties: { name: 'James Smith', title: 'Chief Executive Officer' } },
                { id: 'e1', labels: ['Employee'], properties: { name: 'Donna Smith', department: 'Operations' } },
                { id: 'e2', labels: ['Employee'], properties: { name: 'Mary Smith', department: 'Engineering' } },
                { id: 's1', labels: ['Skill'], properties: { name: 'Leadership' } },
                { id: 's2', labels: ['Skill'], properties: { name: 'Decision Making' } },
              ],
              relationships: [
                { start: { id: 'e1' }, end: { id: 'center' }, type: 'REPORTS_TO' },
                { start: { id: 'e2' }, end: { id: 'center' }, type: 'REPORTS_TO' },
                { start: { id: 'e1' }, end: { id: 's1' }, type: 'HAS_SKILL' },
                { start: { id: 'e2' }, end: { id: 's2' }, type: 'HAS_SKILL' },
              ],
            },
          },
        }),
      })

    render(<DashboardPage />)

    await screen.findByText('Workforce Assistant')
    await screen.findByText('Leadership network snapshot')
    expect(screen.getByText('2 direct reports')).toBeInTheDocument()
    expect(screen.getByText('2 functions')).toBeInTheDocument()
    expect(screen.getAllByText('Leadership').length).toBeGreaterThan(0)
    expect(screen.getByText('Open full talent graph')).toBeInTheDocument()
    expect(screen.queryByText('Department Mix')).not.toBeInTheDocument()
    expect(screen.queryByText('Response Pattern')).not.toBeInTheDocument()
    expect(screen.getByText('Start with a grounded workforce question')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
