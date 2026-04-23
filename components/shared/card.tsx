import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  children: ReactNode
  className?: string
}
export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`surface-card rounded-[24px] p-6 ${className}`}>
      {title && <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-500">{title}</h3>}
      {children}
    </div>
  )
}
