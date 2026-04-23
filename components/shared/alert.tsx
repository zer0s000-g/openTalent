interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
}

const alertStyles = {
  info: 'border-primary-200 bg-primary-50/90 text-primary-900',
  success: 'border-emerald-200 bg-emerald-50/90 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50/90 text-amber-800',
  error: 'border-rose-200 bg-rose-50/90 text-rose-800',
}

export function Alert({ type, title, description }: AlertProps) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${alertStyles[type]}`}>
      <h4 className="font-semibold">{title}</h4>
      {description && <p className="mt-1.5 text-sm opacity-90">{description}</p>}
    </div>
  )
}
