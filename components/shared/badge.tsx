interface BadgeProps {
  children: React.ReactNode
  color?: 'gray' | 'blue' | 'green' | 'yellow' | 'red'
}

const colorStyles = {
  gray: 'bg-gray-50 text-gray-600 border border-gray-200',
  blue: 'bg-blue-50 text-blue-600 border border-blue-200',
  green: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
  yellow: 'bg-amber-50 text-amber-600 border border-amber-200',
  red: 'bg-rose-50 text-rose-600 border border-rose-200',
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${colorStyles[color]}`}>
      {children}
    </span>
  )
}
