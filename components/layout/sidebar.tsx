'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthSession } from '@/components/auth/session-provider'
import { hasRequiredRole, type AppUserRole } from '@/lib/auth/session'

interface NavigationItem {
  name: string
  href: string
  description: string
  requiredRole?: AppUserRole
  icon: React.ReactNode
}

const navigation: NavigationItem[] = [
  {
    name: 'Command Center',
    href: '/dashboard',
    description: 'Workforce overview',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 13h6V4H4v9Zm10 7h6v-6h-6v6Zm0-10h6V4h-6v6ZM4 20h6v-3H4v3Z" />
      </svg>
    ),
  },
  {
    name: 'Talent Graph',
    href: '/graph',
    description: 'Explore connections',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7a2 2 0 1 0 0-.01ZM18 6a2 2 0 1 0 0-.01ZM12 19a2 2 0 1 0 0-.01Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m7.7 8.1 2.9 8.1m5.7-8.1-2.9 8.1M8 6h8" />
      </svg>
    ),
  },
  {
    name: 'Skills Intelligence',
    href: '/skills',
    description: 'Capabilities and coverage',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7.5h12M6 12h8m-8 4.5h5m7.5-9.75 1.75 1.75a1.5 1.5 0 0 1 0 2.12l-4.88 4.88a2 2 0 0 1-.88.51l-2.69.67.67-2.69a2 2 0 0 1 .51-.88l4.88-4.88a1.5 1.5 0 0 1 2.12 0Z" />
      </svg>
    ),
  },
  {
    name: 'Indonesia Footprint',
    href: '/locations',
    description: 'Talent distribution map',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 7.5c1.8-1.7 4.4-2.5 7-2.5 3.8 0 6.9 1.7 6.9 4 0 2-2.4 3.5-5.6 3.9m-2.8 0c-2.9.5-5.1 1.9-5.1 3.7 0 2.3 3.1 4 6.9 4 3.8 0 6.9-1.7 6.9-4 0-1.3-1-2.4-2.7-3.1" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9.2 10.7c.6-.5 1.4-.8 2.3-.8 1.7 0 3.1 1 3.1 2.2 0 1.2-1.4 2.2-3.1 2.2-1.7 0-3.1-1-3.1-2.2 0-.5.3-1 .8-1.4Z" />
      </svg>
    ),
  },
  {
    name: 'Data Operations',
    href: '/admin/import',
    description: 'Import and manage records',
    requiredRole: 'admin' as AppUserRole,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 16V4m0 12 4-4m-4 4-4-4M5 19h14" />
      </svg>
    ),
  },
]

interface SidebarProps {
  collapsed: boolean
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname()
  const { session } = useAuthSession()
  const navigationItems = navigation.filter((item) =>
    item.requiredRole ? hasRequiredRole(session, item.requiredRole) : true,
  )

  return (
    <aside
      aria-hidden={collapsed}
      className={`fixed left-0 top-0 z-40 flex h-screen w-[18rem] flex-col border-r border-white/70 bg-[linear-gradient(180deg,rgba(12,18,31,0.98)_0%,rgba(18,28,48,0.98)_100%)] px-4 py-4 text-white shadow-2xl transition-transform duration-300 ${
        collapsed ? '-translate-x-full pointer-events-none' : 'translate-x-0'
      }`}
    >
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        <Link href="/dashboard" className="block">
          <div className="section-label !text-blue-200">OpenTalent AirNav</div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-cyan-400 shadow-lg shadow-primary-900/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6.5 17.5 12 6l5.5 11.5M8.4 13.5h7.2" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg font-semibold tracking-tight">Workforce OS</p>
              <p className="text-sm text-slate-300">Enterprise talent intelligence</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="px-2 pb-3 pt-6">
        <p className="section-label !text-slate-400">Navigate</p>
      </div>

      <nav className="space-y-2 px-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-start gap-3 rounded-2xl px-4 py-3 transition-all ${
                isActive
                  ? 'bg-white text-ink-900 shadow-soft'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                isActive ? 'bg-primary-50 text-primary-700' : 'bg-white/6 text-slate-300 group-hover:bg-white/10 group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="font-medium">{item.name}</div>
                <div className={`mt-0.5 text-xs ${isActive ? 'text-ink-500' : 'text-slate-400 group-hover:text-slate-300'}`}>
                  {item.description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto px-2">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="section-label !text-slate-400">Workspace</p>
          <p className="mt-3 font-medium text-white">Internal workforce workspace</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Explore workforce structure, skills, and relationships through an authenticated AirNav Indonesia workspace.
          </p>
        </div>
      </div>
    </aside>
  )
}
