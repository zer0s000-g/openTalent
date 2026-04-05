'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Badge } from '@/components/shared/badge'

type SearchResultType = 'employee' | 'skill' | 'department'

interface UnifiedSearchResult {
  type: SearchResultType
  key: string
  title: string
  subtitle: string
  meta?: string
  employee_id?: string
  skillName?: string
  department?: string
  score: number
}

async function queryUnifiedSearch(query: string) {
  const response = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query UnifiedSearch($query: String!) {
          unifiedSearch(query: $query) {
            type
            key
            title
            subtitle
            meta
            employee_id
            skillName
            department
            score
          }
        }
      `,
      variables: { query },
    }),
  })

  const payload = await response.json()
  if (payload.errors) {
    throw new Error(payload.errors[0]?.message || 'Unified search failed')
  }

  return (payload.data?.unifiedSearch || []) as UnifiedSearchResult[]
}

function buildSearchHref(result: UnifiedSearchResult) {
  if (result.type === 'employee' && result.employee_id) {
    return `/employee/${result.employee_id}`
  }

  if (result.type === 'skill' && result.skillName) {
    return `/skills?skill=${encodeURIComponent(result.skillName)}`
  }

  if (result.type === 'department' && result.department) {
    return `/graph?mode=department&department=${encodeURIComponent(result.department)}`
  }

  return '/graph'
}

const TYPE_LABELS: Record<SearchResultType, string> = {
  employee: 'Employees',
  skill: 'Skills',
  department: 'Departments',
}

const TYPE_BADGE: Record<SearchResultType, 'blue' | 'green' | 'yellow'> = {
  employee: 'blue',
  skill: 'green',
  department: 'yellow',
}

export function UnifiedCommandSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UnifiedSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const cacheRef = useRef<Map<string, UnifiedSearchResult[]>>(new Map())
  const requestIdRef = useRef(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        return
      }

      if (event.key === '/' && !open) {
        const target = event.target as HTMLElement | null
        const tag = target?.tagName?.toLowerCase()
        const isTypingTarget = tag === 'input' || tag === 'textarea' || target?.isContentEditable
        if (!isTypingTarget) {
          event.preventDefault()
          setOpen(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return

    const raf = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(raf)
  }, [open])

  useEffect(() => {
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
    setLoading(false)
    setActiveIndex(0)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const normalized = query.trim().toLowerCase()
    if (normalized.length < 2) {
      setResults([])
      setError(null)
      setLoading(false)
      setActiveIndex(0)
      return
    }

    const cached = cacheRef.current.get(normalized)
    if (cached) {
      setResults(cached)
      setError(null)
      setLoading(false)
      setActiveIndex(0)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)

    const timeout = window.setTimeout(async () => {
      try {
        const data = await queryUnifiedSearch(normalized)
        if (requestId !== requestIdRef.current) return

        cacheRef.current.set(normalized, data)
        setResults(data)
        setActiveIndex(0)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, 120)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [open, query])

  const groupedResults = useMemo(() => {
    return results.reduce<Record<SearchResultType, UnifiedSearchResult[]>>(
      (groups, result) => {
        groups[result.type].push(result)
        return groups
      },
      {
        employee: [],
        skill: [],
        department: [],
      },
    )
  }, [results])

  const flatResults = useMemo(
    () => [
      ...groupedResults.employee,
      ...groupedResults.skill,
      ...groupedResults.department,
    ],
    [groupedResults],
  )

  useEffect(() => {
    if (activeIndex >= flatResults.length) {
      setActiveIndex(0)
    }
  }, [activeIndex, flatResults.length])

  const handleSelectResult = (result: UnifiedSearchResult) => {
    setOpen(false)
    setQuery('')
    setResults([])
    setError(null)
    router.push(buildSearchHref(result))
  }

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      return
    }

    if (!flatResults.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % flatResults.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const activeResult = flatResults[activeIndex]
      if (activeResult) {
        handleSelectResult(activeResult)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open unified search"
        className="flex w-full items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white/80 px-4 py-3 text-left shadow-sm transition-all hover:border-primary-200 hover:bg-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-ink-400">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-700">Search employees, skills, or departments</p>
          <p className="truncate text-xs text-ink-400">Jump straight into profiles, skill clusters, and org maps.</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm font-semibold text-ink-500">
            /
          </span>
          <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm font-semibold text-ink-500">
            Ctrl K
          </span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-ink-900/25 px-4 py-[8vh] backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Unified search"
            onKeyDown={handleDialogKeyDown}
            className="relative z-[81] flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
          >
            <div className="border-b border-[color:var(--border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5 text-ink-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search people, skills, departments, or employee IDs"
                  className="flex-1 border-0 bg-transparent text-base text-ink-900 outline-none placeholder:text-ink-400"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-[color:var(--border)] px-3 py-1 text-sm font-medium text-ink-500 transition-colors hover:bg-slate-50"
                >
                  Esc
                </button>
              </div>
            </div>

            <div className="min-h-[18rem] overflow-y-auto px-5 py-4">
              {!query.trim() && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Quick Jump</p>
                    <p className="mt-2 text-sm text-ink-500">
                      Start typing a person, skill, department, or employee ID. Use arrow keys to move and Enter to open.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge color="blue">Employees</Badge>
                    <Badge color="green">Skills</Badge>
                    <Badge color="yellow">Departments</Badge>
                  </div>
                </div>
              )}

              {query.trim().length > 0 && query.trim().length < 2 && (
                <p className="text-sm text-ink-500">Type at least 2 characters to search.</p>
              )}

              {loading && (
                <div className="flex h-40 items-center justify-center text-sm text-ink-500">
                  Searching the workspace...
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!loading && !error && query.trim().length >= 2 && flatResults.length === 0 && (
                <div className="flex h-40 items-center justify-center text-sm text-ink-500">
                  No matching employees, skills, or departments found.
                </div>
              )}

              {!loading && !error && flatResults.length > 0 && (
                <div className="space-y-5">
                  {(Object.keys(TYPE_LABELS) as SearchResultType[]).map((type) => {
                    const items = groupedResults[type]
                    if (items.length === 0) return null

                    return (
                      <div key={type}>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">{TYPE_LABELS[type]}</p>
                          <Badge color={TYPE_BADGE[type]}>{items.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {items.map((result) => {
                            const index = flatResults.findIndex((item) => item.key === result.key && item.type === result.type)
                            const isActive = index === activeIndex

                            return (
                              <button
                                key={`${result.type}:${result.key}`}
                                type="button"
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => handleSelectResult(result)}
                                className={`flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                                  isActive
                                    ? 'border-primary-200 bg-primary-50 shadow-sm'
                                    : 'border-[color:var(--border)] bg-white hover:border-primary-100 hover:bg-slate-50'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate font-medium text-ink-900">{result.title}</p>
                                    <Badge color={TYPE_BADGE[result.type]}>{result.subtitle}</Badge>
                                  </div>
                                  {result.meta && (
                                    <p className="mt-1 truncate text-sm text-ink-500">{result.meta}</p>
                                  )}
                                </div>
                                <span className="shrink-0 text-sm text-ink-400">Open</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
