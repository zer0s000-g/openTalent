import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
}
const colorStyles = {
  gray: 'border border-slate-200 bg-white/80 text-ink-600',
  blue: 'border border-primary-200 bg-primary-50 text-primary-800',
  green: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  yellow: 'border border-amber-200 bg-amber-50 text-amber-700',
  red: 'border border-rose-200 bg-rose-50 text-rose-700',
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colorStyles[color]}`}>
      {children}
    </span>
  )
}
