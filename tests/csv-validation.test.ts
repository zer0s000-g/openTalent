import { describe, it, expect } from 'vitest'

// Test CSV validation logic
function validateCSVRow(row: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!row.employee_id || row.employee_id.trim() === '') {
    errors.push('employee_id is required')
  }

  if (!row.name || row.name.trim() === '') {
    errors.push('name is required')
  }

  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push('Invalid email format')
  }

  if (row.hired_date && !/^\d{4}-\d{2}-\d{2}$/.test(row.hired_date)) {
    errors.push('hired_date must be in YYYY-MM-DD format')
  }

  return { valid: errors.length === 0, errors }
}

describe('CSV Validation', () => {
  it('should validate a correct row', () => {
    const row = {
      employee_id: 'EMP0001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      hired_date: '2023-01-15',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject a row missing employee_id', () => {
    const row = {
      name: 'John Doe',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('employee_id is required')
  })

  it('should reject a row missing name', () => {
    const row = {
      employee_id: 'EMP0001',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('name is required')
  })

  it('should reject invalid email format', () => {
    const row = {
      employee_id: 'EMP0001',
      name: 'John Doe',
      email: 'invalid-email',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Invalid email format')
  })

  it('should reject invalid date format', () => {
    const row = {
      employee_id: 'EMP0001',
      name: 'John Doe',
      hired_date: '01-15-2023',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('hired_date must be in YYYY-MM-DD format')
  })

  it('should accept row with only required fields', () => {
    const row = {
      employee_id: 'EMP0001',
      name: 'John Doe',
    }

    const result = validateCSVRow(row)
    expect(result.valid).toBe(true)
  })
})
