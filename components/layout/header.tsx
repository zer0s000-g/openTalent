'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/shared/badge'
import { UnifiedCommandSearch } from './unified-command-search'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Command Center',
    subtitle: 'Monitor workforce health, movement, and organizational readiness.',
  },
  '/graph': {
    title: 'Talent Graph',
    subtitle: 'Inspect reporting lines, skill adjacency, and employee networks.',
  },
  '/skills': {
    title: 'Skills Intelligence',
    subtitle: 'Understand capability coverage and identify expertise quickly.',
  },
  '/locations': {
    title: 'Indonesia Footprint',
    subtitle: 'See how skills, roles, and workforce capacity are distributed across Indonesian cities.',
  },
  '/admin/import': {
    title: 'Data Operations',
    subtitle: 'Manage imports and keep workforce records current.',
  },
}

interface HeaderProps {
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

function getPageMeta(pathname: string) {
  if (pathname.startsWith('/employee/')) {
    return {
      title: 'Employee Profile',
      subtitle: 'Review individual context, relationships, and growth signals.',
    }
  }

  return pageMeta[pathname] || {
    title: 'OpenTalent AirNav',
    subtitle: 'Enterprise talent intelligence and workforce exploration.',
  }
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const pathname = usePathname()
  const meta = getPageMeta(pathname)

  return (
    <header className="surface-panel sticky top-0 z-30 mx-6 mt-6 rounded-[28px] px-6 py-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
              aria-pressed={sidebarCollapsed}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-[18px] border shadow-sm transition-all ${
                sidebarCollapsed
                  ? 'border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100'
                  : 'border-[color:var(--border)] bg-white/90 text-ink-700 hover:bg-primary-50'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
                {sidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 6h10M9 12h10M9 18h10M5 6l2.5 2.5L5 11M5 13l2.5 2.5L5 18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 6h14M5 12h14M5 18h14" />
                )}
              </svg>
            </button>
            <div className="section-label">Talent Platform</div>
          </div>
          <h1 className="mt-2 font-display text-[2rem] font-semibold leading-tight text-ink-900">
            {meta.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-3 lg:min-w-[26rem]">
          <UnifiedCommandSearch />

          <div className="flex flex-wrap items-center gap-2">
            <Badge color="blue">Live Workspace</Badge>
            <Badge color="green">Graph Ready</Badge>
            <Badge color="gray">200 employees seeded</Badge>
          </div>
        </div>
      </div>
    </header>
  )
}
