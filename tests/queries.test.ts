import { describe, it, expect } from 'vitest'
import { parseDashboardStats } from '@/lib/queries/dashboard-queries'
import { parseSearchResults, filterEmployeesByQuery } from '@/lib/queries/employee-queries'

describe('Dashboard Queries', () => {
  describe('parseDashboardStats', () => {
    it('should parse dashboard stats correctly', () => {
      const rawData = {
        employeesAggregate: { count: 150 },
        skillsAggregate: { count: 45 },
        departments: [
          { department: 'Engineering' },
          { department: 'Engineering' },
          { department: 'Engineering' },
          { department: 'Sales' },
          { department: 'Sales' },
          { department: null },
        ],
      }

      const result = parseDashboardStats(rawData)

      expect(result.totalEmployees).toBe(150)
      expect(result.totalSkills).toBe(45)
      expect(result.departments).toHaveLength(2)
      expect(result.departments[0]).toEqual({ name: 'Engineering', count: 3 })
      expect(result.departments[1]).toEqual({ name: 'Sales', count: 2 })
    })

    it('should handle empty data', () => {
      const rawData = {
        employeesAggregate: { count: 0 },
        skillsAggregate: { count: 0 },
        departments: [],
      }

      const result = parseDashboardStats(rawData)

      expect(result.totalEmployees).toBe(0)
      expect(result.totalSkills).toBe(0)
      expect(result.departments).toHaveLength(0)
    })

    it('should sort departments by count descending', () => {
      const rawData = {
        employeesAggregate: { count: 100 },
        skillsAggregate: { count: 20 },
        departments: [
          { department: 'HR' },
          { department: 'Engineering' },
          { department: 'Engineering' },
          { department: 'Engineering' },
          { department: 'Sales' },
          { department: 'Sales' },
        ],
      }

      const result = parseDashboardStats(rawData)

      expect(result.departments[0].name).toBe('Engineering')
      expect(result.departments[0].count).toBe(3)
      expect(result.departments[1].name).toBe('Sales')
      expect(result.departments[2].name).toBe('HR')
    })
  })
})

describe('Employee Search Queries', () => {
  const sampleEmployees = [
    { employee_id: 'EMP001', name: 'John Doe', title: 'Engineer', department: 'Engineering' },
    { employee_id: 'EMP002', name: 'Jane Smith', title: 'Designer', department: 'Design' },
    { employee_id: 'EMP003', name: 'Bob Wilson', title: 'Sales Manager', department: 'Sales' },
    { employee_id: 'EMP004', name: 'Alice Brown', title: 'Senior Engineer', department: 'Engineering' },
  ]

  describe('parseSearchResults', () => {
    it('should parse search results correctly', () => {
      const rawData = {
        searchEmployees: sampleEmployees,
      }

      const result = parseSearchResults(rawData)

      expect(result).toHaveLength(4)
      expect(result[0].employee_id).toBe('EMP001')
    })

    it('should handle null data', () => {
      const result = parseSearchResults(null)
      expect(result).toEqual([])
    })
  })

  describe('filterEmployeesByQuery', () => {
    it('should filter by name', () => {
      const result = filterEmployeesByQuery(sampleEmployees, 'john')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('John Doe')
    })

    it('should filter by title', () => {
      const result = filterEmployeesByQuery(sampleEmployees, 'engineer')
      expect(result).toHaveLength(2)
    })

    it('should filter by department', () => {
      const result = filterEmployeesByQuery(sampleEmployees, 'sales')
      expect(result).toHaveLength(1)
      expect(result[0].department).toBe('Sales')
    })

    it('should return all for empty query', () => {
      const result = filterEmployeesByQuery(sampleEmployees, '')
      expect(result).toHaveLength(4)
    })

    it('should return empty for no matches', () => {
      const result = filterEmployeesByQuery(sampleEmployees, 'xyz123')
      expect(result).toHaveLength(0)
    })
  })
})
