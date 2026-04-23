import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-50'

  const variantStyles = {
    primary:
      'bg-ink-900 text-white shadow-soft hover:-translate-y-0.5 hover:bg-ink-800 focus-visible:ring-[var(--ring)]',
    secondary:
      'border border-[color:var(--border-strong)] bg-white/85 text-ink-800 shadow-sm hover:border-primary-200 hover:bg-white focus-visible:ring-[var(--ring)]',
    ghost:
      'text-ink-600 hover:bg-white/70 hover:text-ink-900 focus-visible:ring-[var(--ring)]',
  }

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-4.5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
