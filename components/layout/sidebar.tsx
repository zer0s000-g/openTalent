'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Graph Explorer', href: '/graph' },
  { name: 'Skills', href: '/skills' },
  { name: 'Admin', href: '/admin/import' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 mt-2">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            O
          </div>
          OpenTalent
        </Link>
      </div>
      <nav className="space-y-1.5 p-4 mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-100/50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
