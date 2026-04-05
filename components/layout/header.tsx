export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-gray-200 bg-white px-8 py-6">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </header>
  )
}
