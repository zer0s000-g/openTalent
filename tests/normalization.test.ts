import { describe, it, expect } from 'vitest'
import { normalizeName, parseDelimitedList } from '@/lib/normalization'

describe('Normalization', () => {
  it('normalizes names to title case', () => {
    expect(normalizeName('  machine LEARNING  ')).toBe('Machine Learning')
  })

  it('parses and deduplicates delimited lists', () => {
    expect(parseDelimitedList('python; Python ;  SQL')).toEqual(['Python', 'Sql'])
  })

  it('returns empty list for undefined', () => {
    expect(parseDelimitedList(undefined)).toEqual([])
  })
})
