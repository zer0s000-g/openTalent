import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WorkforceAssistantCard } from '@/components/dashboard/workforce-assistant-card'

vi.mock('@/components/shared/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => <section className={className}>{children}</section>,
}))

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

vi.mock('@/components/shared/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    disabled?: boolean
    className?: string
  }) => (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
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

describe('WorkforceAssistantCard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
  })

  it('sends a workforce question and renders the grounded answer with deep links', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        answer: 'I found 2 strong software-programming matches in Jakarta.',
        intent: 'top_employees_by_capability',
        confidence: 'high',
        results: [
          {
            type: 'employee',
            key: 'EMP0001',
            title: 'James Smith',
            subtitle: 'Software Engineer',
            meta: 'Software Engineer • Engineering • Jakarta • 2 matched skills',
            href: '/employee/EMP0001',
            score: 91,
          },
        ],
        followUps: ['Which skills are strongest in Jakarta?'],
        actions: [{ label: 'Open employee', href: '/employee/EMP0001' }],
        grounding: [{ type: 'city', label: 'Jakarta' }, { type: 'skill', label: 'Python' }],
      }),
    })

    render(<WorkforceAssistantCard />)

    fireEvent.change(screen.getByPlaceholderText(/ask a workforce question/i), {
      target: { value: 'Give me the top 5 employees in software programming domain.' },
    })
    fireEvent.click(screen.getByText('Ask assistant'))

    expect(await screen.findByText('I found 2 strong software-programming matches in Jakarta.')).toBeInTheDocument()
    expect(screen.getByText('James Smith')).toBeInTheDocument()
    expect(screen.getByText('Open employee')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  it('shows an error state when the assistant request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Assistant unavailable' }),
    })

    render(<WorkforceAssistantCard />)

    fireEvent.click(screen.getByText('Give me the top 5 employees in software programming domain.'))

    expect(await screen.findByText('Assistant unavailable')).toBeInTheDocument()
  })
})
