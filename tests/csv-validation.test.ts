import { describe, it, expect } from 'vitest'
import { CsvEmployeeRowSchema } from '@/lib/validation'

describe('CSV Validation', () => {
  it('accepts valid rows', () => {
    const result = CsvEmployeeRowSchema.safeParse({
      employee_id: 'EMP0001',
      name: 'Jane Doe',
      email: 'jane@company.com',
      hired_date: '2024-06-10',
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const result = CsvEmployeeRowSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = CsvEmployeeRowSchema.safeParse({
      employee_id: 'EMP0010',
      name: 'Valid Name',
      email: 'bad-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid hired_date format', () => {
    const result = CsvEmployeeRowSchema.safeParse({
      employee_id: 'EMP0010',
      name: 'Valid Name',
      hired_date: '06-10-2024',
    })
    expect(result.success).toBe(false)
  })
})
