interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]'

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 border border-transparent',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-600 hover:bg-gray-100 shadow-none hover:shadow-none',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
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
