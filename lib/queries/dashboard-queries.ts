/**
 * Dashboard queries for workforce statistics
 */

export const DASHBOARD_STATS_QUERY = `
  query GetDashboardStats {
    employeesAggregate {
      count
    }
    skillsAggregate {
      count
    }
    departments: employees {
      department
    }
  }
`

export const DEPARTMENT_COUNT_QUERY = `
  query GetDepartmentCounts {
    employees {
      department
    }
  }
`

export interface DashboardStats {
  totalEmployees: number
  totalSkills: number
  departments: Array<{ name: string; count: number }>
}

export function parseDashboardStats(data: any): DashboardStats {
  const deptCounts = new Map<string, number>()

  data.departments?.forEach((emp: any) => {
    const dept = emp.department
    if (dept) {
      deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1)
    }
  })

  return {
    totalEmployees: data.employeesAggregate?.count || 0,
    totalSkills: data.skillsAggregate?.count || 0,
    departments: Array.from(deptCounts.entries()).map(([name, count]) => ({
      name,
      count,
    })).sort((a, b) => b.count - a.count),
  }
}
