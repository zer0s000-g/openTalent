interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description?: string
}

const alertStyles = {
  info: 'bg-primary-50 text-primary-800 border-primary-200',
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
}

export function Alert({ type, title, description }: AlertProps) {
  return (
    <div className={`rounded-lg border p-4 ${alertStyles[type]}`}>
      <h4 className="font-medium">{title}</h4>
      {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
    </div>
  )
}
