import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { UnifiedCommandSearch } from '@/components/layout/unified-command-search'

const push = vi.fn()
const mockFetch = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/dashboard',
}))

vi.mock('@/components/shared/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

describe('UnifiedCommandSearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    mockFetch.mockReset()
    push.mockReset()
  })

  it('opens the command surface, searches, and routes a skill result to the deep-linked skills page', async () => {
    mockFetch.mockResolvedValue({
      json: async () => ({
        data: {
          unifiedSearch: [
            {
              type: 'skill',
              key: 'Python',
              title: 'Python',
              subtitle: 'Skill',
              meta: '29 employees',
              skillName: 'Python',
              score: 440,
            },
            {
              type: 'employee',
              key: 'EMP0001',
              title: 'James Smith',
              subtitle: 'Chief Executive Officer',
              meta: 'Executive',
              employee_id: 'EMP0001',
              score: 300,
            },
          ],
        },
      }),
    })

    render(<UnifiedCommandSearch />)

    fireEvent.click(screen.getByRole('button', { name: 'Open unified search' }))
    fireEvent.change(screen.getByPlaceholderText(/search people, skills, departments, or employee ids/i), {
      target: { value: 'python' },
    })

    await screen.findByText('Python')
    fireEvent.click(screen.getByRole('button', { name: /python skill 29 employees open/i }))

    expect(push).toHaveBeenCalledWith('/skills?skill=Python')
  })

  it('opens from the keyboard shortcut', async () => {
    render(<UnifiedCommandSearch />)

    fireEvent.keyDown(window, { key: 'k', metaKey: true })

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Unified search' })).toBeInTheDocument()
    })
  })
})
