import { NextRequest } from 'next/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const runWorkforceAssistant = vi.fn()

vi.mock('@/lib/workforce-assistant/service', () => ({
  runWorkforceAssistant,
}))

describe('POST /api/assistant', () => {
  afterEach(() => {
    runWorkforceAssistant.mockReset()
  })

  it('returns a structured grounded response', async () => {
    runWorkforceAssistant.mockResolvedValueOnce({
      answer: 'I found 5 strong software-programming matches.',
      intent: 'top_employees_by_capability',
      confidence: 'high',
      results: [{ type: 'employee', key: 'EMP0001', title: 'James Smith', subtitle: 'Software Engineer', href: '/employee/EMP0001', score: 92 }],
      followUps: ['Where are software engineers located?'],
      actions: [{ label: 'Open employee', href: '/employee/EMP0001' }],
      grounding: [{ type: 'skill', label: 'Python' }],
    })

    const { POST } = await import('@/app/api/assistant/route')

    const request = new NextRequest('http://localhost/api/assistant', {
      method: 'POST',
      body: JSON.stringify({ message: 'Give me the top 5 employees in software programming domain.' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.answer).toContain('strong software-programming matches')
    expect(runWorkforceAssistant).toHaveBeenCalledWith({
      message: 'Give me the top 5 employees in software programming domain.',
    })
  })

  it('rejects an empty assistant request', async () => {
    const { POST } = await import('@/app/api/assistant/route')

    const request = new NextRequest('http://localhost/api/assistant', {
      method: 'POST',
      body: JSON.stringify({ message: ' ' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error).toContain('Please enter a more specific workforce question')
  })

  it('returns a server error when the assistant service fails', async () => {
    runWorkforceAssistant.mockRejectedValueOnce(new Error('Provider unavailable'))

    const { POST } = await import('@/app/api/assistant/route')

    const request = new NextRequest('http://localhost/api/assistant', {
      method: 'POST',
      body: JSON.stringify({ message: 'Where are software engineers located?' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.error).toContain('Provider unavailable')
  })
})
