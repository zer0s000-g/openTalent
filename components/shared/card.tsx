interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {title && <h3 className="mb-4 text-sm font-semibold text-gray-800 tracking-tight">{title}</h3>}
      {children}
    </div>
  )
}
