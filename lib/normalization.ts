export function normalizeName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function parseDelimitedList(value?: string): string[] {
  if (!value) return []
  return Array.from(
    new Set(
      value
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
        .map(normalizeName),
    ),
  )
}
