'use client'

import React, { useMemo, useState } from 'react'
import { Badge } from '@/components/shared/badge'
import { Button } from '@/components/shared/button'
import { Card } from '@/components/shared/card'
import { EmptyState } from '@/components/shared/empty-state'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import type { AssistantConversationTurn, AssistantResponse } from '@/lib/workforce-assistant/types'

const EXAMPLE_PROMPTS = [
  'Give me the top 5 employees in software programming domain.',
  'Which skills are most concentrated in Engineering?',
  'Where are software engineers located?',
  'Who are the strongest Python employees in Jakarta?',
]

type ConversationEntry =
  | { id: string; role: 'user'; content: string }
  | { id: string; role: 'assistant'; content: string; response: AssistantResponse }

async function queryAssistant(message: string, conversation: AssistantConversationTurn[]) {
  const response = await fetch('/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversation }),
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(payload.error || 'Assistant request failed')
  }

  return payload as AssistantResponse
}

function ConversationBubble({ entry }: { entry: ConversationEntry }) {
  if (entry.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[24px] bg-ink-900 px-4 py-3 text-sm leading-6 text-white shadow-panel">
          {entry.content}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-[26px] border border-[color:var(--border)] bg-white/88 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-900">Workforce Assistant</p>
          <p className="mt-2 text-sm leading-6 text-ink-600">{entry.response.answer}</p>
        </div>
        <Badge color={entry.response.confidence === 'high' ? 'green' : entry.response.confidence === 'medium' ? 'blue' : 'yellow'}>
          {entry.response.confidence} confidence
        </Badge>
      </div>

      {entry.response.grounding.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.response.grounding.map((item) => (
            <Badge key={`${item.type}-${item.label}`} color="gray">
              {item.label}
            </Badge>
          ))}
        </div>
      )}

      {entry.response.results.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {entry.response.results.map((result, index) => (
            <a
              key={`${result.type}-${result.key}`}
              href={result.href}
              className="rounded-[22px] border border-[color:var(--border)] bg-slate-50/80 p-4 transition-all hover:border-primary-200 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Rank {index + 1}</p>
                  <p className="mt-2 text-base font-semibold text-ink-900">{result.title}</p>
                  <p className="mt-1 text-sm text-ink-600">{result.subtitle}</p>
                </div>
                <Badge color="blue">{Math.round(result.score)}</Badge>
              </div>
              {result.meta && <p className="mt-3 text-sm leading-6 text-ink-500">{result.meta}</p>}
            </a>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No grounded results yet"
          description="Try naming a specific skill, role, department, or city so the assistant can retrieve workforce records."
        />
      )}

      {(entry.response.actions.length > 0 || entry.response.followUps.length > 0) && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {entry.response.actions.map((action) => (
              <a
                key={`${action.label}-${action.href}`}
                href={action.href}
                className="inline-flex items-center justify-center rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-ink-800"
              >
                {action.label}
              </a>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {entry.response.followUps.map((followUp) => (
              <span
                key={followUp}
                className="rounded-full border border-[color:var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-ink-500"
              >
                {followUp}
              </span>
            ))}
          </div>
        </div>
      )}

      {entry.response.warnings?.length ? (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
          {entry.response.warnings[0]}
        </div>
      ) : null}
    </div>
  )
}

export function WorkforceAssistantCard() {
  const [message, setMessage] = useState('')
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assistantHistory = useMemo<AssistantConversationTurn[]>(
    () =>
      conversation.slice(-6).map((entry) => ({
        role: entry.role,
        content: entry.content,
      })),
    [conversation],
  )

  const submitPrompt = async (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed || loading) return

    const userEntry: ConversationEntry = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    }

    setConversation((current) => [...current, userEntry])
    setMessage('')
    setLoading(true)
    setError(null)

    try {
      const response = await queryAssistant(trimmed, assistantHistory)
      setConversation((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.answer,
          response,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The assistant could not complete that request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-label">Workforce Assistant</p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-ink-900">Ask grounded questions about people, skills, and locations</h3>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Query the workforce graph in plain language to surface ranked employees, capability concentration, and city or department distribution without leaving the Command Center.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color="blue">Grounded answers</Badge>
            <Badge color="green">Deep links</Badge>
            <Badge color="gray">OpenAI-compatible</Badge>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_280px]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[color:var(--border)] bg-[radial-gradient(circle_at_top,rgba(63,115,230,0.10),transparent_30%),linear-gradient(180deg,#f9fbff_0%,#f2f6fb_100%)] p-5">
              <div className="flex flex-col gap-4">
                <label className="block">
                  <span className="sr-only">Ask the workforce assistant</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={4}
                    placeholder="Ask a workforce question, for example: give me the top 5 employees in software programming domain."
                    className="min-h-[8.75rem] w-full resize-none rounded-[24px] border border-[color:var(--border)] bg-white/92 px-5 py-4 text-base leading-7 text-ink-900 outline-none transition-all focus:border-primary-300 focus:ring-4 focus:ring-[var(--ring)]"
                  />
                </label>

                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void submitPrompt(prompt)}
                        className="rounded-full border border-[color:var(--border)] bg-white/88 px-3 py-1.5 text-xs font-medium text-ink-600 transition-all hover:border-primary-200 hover:bg-white"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <Button
                    className="min-w-[11rem] self-start lg:self-auto"
                    onClick={() => void submitPrompt(message)}
                    disabled={loading || message.trim().length < 2}
                  >
                    {loading ? 'Thinking...' : 'Ask assistant'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="min-h-[25rem] max-h-[42rem] space-y-4 overflow-y-auto pr-1">
              {conversation.length === 0 && !loading ? (
                <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-[28px] border border-[color:var(--border)] bg-white/88 px-6 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-7 w-7 text-ink-400">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h8M8 14h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 4h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-4.5L8 20v-3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
                    </svg>
                  </div>
                  <p className="mt-5 font-display text-2xl font-semibold text-ink-900">Start with a grounded workforce question</p>
                  <p className="mt-3 max-w-xl text-base leading-7 text-ink-500">
                    Ask about top employees in a capability domain, strongest skills in a department, or where talent is concentrated across Indonesian cities.
                  </p>
                </div>
              ) : (
                conversation.map((entry) => <ConversationBubble key={entry.id} entry={entry} />)
              )}

              {loading && (
                <div className="flex items-center gap-3 rounded-[24px] border border-[color:var(--border)] bg-white/88 px-4 py-4">
                  <LoadingSpinner size="sm" />
                  <p className="text-sm text-ink-500">Grounding your request against the workforce graph…</p>
                </div>
              )}
            </div>

            {error ? (
              <div className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 xl:pt-1">
            <div className="rounded-[26px] border border-[color:var(--border)] bg-slate-50/80 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-ink-400">What it can answer</p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-ink-600">
                <p>Top employees in a skill or capability domain</p>
                <p>Skills strongest in a department or city</p>
                <p>Locations where a role or capability is concentrated</p>
                <p>Employee lookup by role, city, or mapped expertise</p>
              </div>
              <div className="mt-5 rounded-[20px] border border-white/80 bg-white/80 p-4">
                <p className="text-sm font-semibold text-ink-900">Best first prompts</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-ink-500">
                  <p>Ask for the top employees in a capability domain</p>
                  <p>Name a department or city for stronger grounding</p>
                  <p>Use specific skills like Python, React, or Communication for the most accurate ranking</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
