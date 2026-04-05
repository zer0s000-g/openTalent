/**
 * Employee search query
 */

export const SEARCH_EMPLOYEES_QUERY = `
  query SearchEmployees($query: String!, $limit: Int = 50) {
    searchEmployees(query: $query, limit: $limit) {
      employee_id
      name
      title
      department
      email
    }
  }
`

export interface EmployeeSearchResult {
  employee_id: string
  name: string
  title: string
  department: string
  email?: string
}

export function parseSearchResults(data: any): EmployeeSearchResult[] {
  return data?.searchEmployees || []
}

export function filterEmployeesByQuery(
  employees: EmployeeSearchResult[],
  query: string
): EmployeeSearchResult[] {
  const lowerQuery = query.toLowerCase()
  return employees.filter(
    emp =>
      emp.name.toLowerCase().includes(lowerQuery) ||
      emp.title?.toLowerCase().includes(lowerQuery) ||
      emp.department?.toLowerCase().includes(lowerQuery)
  )
}
