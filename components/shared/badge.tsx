import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
}
const colorStyles = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-primary-100 text-primary-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorStyles[color]}`}>
      {children}
    </span>
  )
}
